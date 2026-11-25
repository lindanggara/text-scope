import argparse
import json
import shutil
import sys
import time
from datetime import datetime
from pathlib import Path

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix, f1_score
from sklearn.naive_bayes import ComplementNB
from sklearn.pipeline import FeatureUnion, Pipeline
from sklearn.svm import SVC

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from baseline import normalisasi_teks

PROCESSED = ROOT / "data" / "processed"
MODELS = ROOT / "models"
BACKEND_MODELS = ROOT / "backend" / "models"
REPORTS = ROOT / "reports" / "results"

LABELS = ["anger", "fear", "joy", "love", "sad", "neutral"]
LABEL_SET = set(LABELS)


def read_csv_checked(path):
    if not path.exists():
        raise FileNotFoundError(f"File tidak ditemukan: {path}")

    df = pd.read_csv(path)

    if not {"text", "label"}.issubset(df.columns):
        raise ValueError(f"{path.name} wajib memiliki kolom text dan label.")

    df = df[["text", "label"]].dropna().copy()
    df["text"] = df["text"].astype(str).str.strip()
    df["label"] = df["label"].astype(str).str.strip().str.lower()
    df = df[(df["text"] != "") & df["label"].isin(LABEL_SET)]

    if df.empty:
        raise ValueError(f"Tidak ada data valid pada {path}")

    return df


def read_registry(model_id):
    candidates = [
        BACKEND_MODELS / "registry.json",
        MODELS / "registry.json",
    ]

    for path in candidates:
        if path.exists():
            registry = json.loads(path.read_text(encoding="utf-8"))

            if "model" not in registry or model_id not in registry["model"]:
                raise ValueError(
                    f"Format registry tidak sesuai: model '{model_id}' "
                    f"tidak ditemukan pada {path}"
                )

            old_score = registry["model"][model_id].get("f1_test")

            if old_score is None:
                raise ValueError(
                    f"Skor f1_test model {model_id} belum tersedia di registry."
                )

            return float(old_score), path

    raise FileNotFoundError("registry.json tidak ditemukan.")


def merge_feedback(feedback_path):
    train_path = PROCESSED / "train.csv"
    train = read_csv_checked(train_path)
    feedback = read_csv_checked(feedback_path)

    if len(feedback) < 20:
        print(
            f"[PERINGATAN] Jumlah data feedback hanya {len(feedback)} baris (< 20). "
            "Retraining dengan data sedikit berisiko memicu overfitting lokal."
        )

    original_count = len(train)

    combined = pd.concat([train, feedback], ignore_index=True)
    combined["_key"] = combined["text"].str.lower().str.strip()

    # Feedback terbaru menggantikan label lama untuk teks identik.
    combined = combined.drop_duplicates("_key", keep="last")
    combined = combined.drop(columns=["_key"]).reset_index(drop=True)

    # Hindari data feedback yang muncul di validation/test.
    valid = read_csv_checked(PROCESSED / "valid.csv")
    test = read_csv_checked(PROCESSED / "test.csv")

    holdout = set(
        valid["text"].str.lower().str.strip()
    ) | set(
        test["text"].str.lower().str.strip()
    )

    feedback_keys = set(feedback["text"].str.lower().str.strip())

    overlap = feedback_keys & holdout
    if overlap:
        raise ValueError(
            f"Ada {len(overlap)} teks feedback yang juga muncul di validation/test. "
            "Periksa data feedback untuk mencegah data leakage."
        )

    return train, combined, len(feedback), len(combined) - original_count


def save_evaluation_artifacts(model_id, y_true, y_pred):
    REPORTS.mkdir(parents=True, exist_ok=True)
    rep = classification_report(
        y_true, y_pred, labels=LABELS, output_dict=True, zero_division=0
    )
    rows = []
    for lbl in LABELS:
        m = rep.get(lbl, {})
        rows.append({
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "model": model_id,
            "label": lbl,
            "precision": round(float(m.get("precision", 0.0)), 4),
            "recall": round(float(m.get("recall", 0.0)), 4),
            "f1": round(float(m.get("f1-score", 0.0)), 4),
            "support": int(m.get("support", 0)),
        })
    pd.DataFrame(rows).to_csv(REPORTS / "latest_per_class_f1.csv", index=False)

    cm = confusion_matrix(y_true, y_pred, labels=LABELS)
    pd.DataFrame(cm, index=LABELS, columns=LABELS).to_csv(REPORTS / "latest_confusion_matrix.csv")


def build_pipeline(model_id):
    word_char = FeatureUnion([
        ("word", TfidfVectorizer(
            max_features=10000,
            ngram_range=(1, 2)
        )),
        ("char", TfidfVectorizer(
            analyzer="char_wb",
            max_features=5000,
            ngram_range=(2, 5)
        )),
    ])

    if model_id == "logreg_baseline":
        return Pipeline([
            ("features", TfidfVectorizer(max_features=10000)),
            ("clf", LogisticRegression(
                max_iter=1000,
                random_state=42
            )),
        ])

    if model_id == "logreg_tuned":
        return Pipeline([
            ("features", word_char),
            ("clf", LogisticRegression(
                C=1.0,
                class_weight="balanced",
                max_iter=1000,
                random_state=42
            )),
        ])

    if model_id == "svm_tuned":
        return Pipeline([
            ("features", word_char),
            ("clf", SVC(
                C=0.1,
                class_weight="balanced",
                probability=True,
                random_state=42
            )),
        ])

    if model_id == "nb_tuned":
        return Pipeline([
            ("features", TfidfVectorizer(max_features=10000)),
            ("clf", ComplementNB()),
        ])

    raise ValueError(f"Model klasik tidak dikenal: {model_id}")


def train_classical(model_id, train, valid, test):
    model = build_pipeline(model_id)

    x_train = train["text"].apply(normalisasi_teks)
    x_valid = valid["text"].apply(normalisasi_teks)
    x_test = test["text"].apply(normalisasi_teks)

    model.fit(x_train, train["label"])

    valid_preds = model.predict(x_valid)
    test_preds = model.predict(x_test)

    valid_score = f1_score(valid["label"], valid_preds, average="macro")
    test_score = f1_score(test["label"], test_preds, average="macro")
    save_evaluation_artifacts(model_id, test["label"].tolist(), list(test_preds))

    return model, round(float(valid_score), 4), round(float(test_score), 4)


def train_transformer(model_id, train, valid, test, epochs, lr):
    import numpy as np
    import torch
    from datasets import Dataset
    from transformers import (
        AutoModelForSequenceClassification,
        AutoTokenizer,
        Trainer,
        TrainingArguments,
    )

    label2id = {label: i for i, label in enumerate(LABELS)}
    id2label = {i: label for i, label in enumerate(LABELS)}

    base_dir = BACKEND_MODELS / model_id
    if not base_dir.exists():
        base_dir = MODELS / model_id

    if not base_dir.exists():
        raise FileNotFoundError(f"Model Transformer tidak ditemukan: {base_dir}")

    tokenizer = AutoTokenizer.from_pretrained(str(base_dir))
    model = AutoModelForSequenceClassification.from_pretrained(
        str(base_dir),
        num_labels=len(LABELS),
        id2label=id2label,
        label2id=label2id,
    )

    def convert(df):
        labels = [label2id[x] for x in df["label"]]
        ds = Dataset.from_dict({
            "text": df["text"].astype(str).tolist(),
            "labels": labels,
        })

        return ds.map(
            lambda batch: tokenizer(
                batch["text"],
                truncation=True,
                padding="max_length",
                max_length=128,
            ),
            batched=True,
        )

    ds_train = convert(train)
    ds_valid = convert(valid)
    ds_test = convert(test)

    output_dir = MODELS / f"_tmp_retrain_{model_id}"

    args = TrainingArguments(
        output_dir=str(output_dir),
        num_train_epochs=epochs,
        per_device_train_batch_size=4,
        per_device_eval_batch_size=4,
        learning_rate=lr,
        weight_decay=0.01,
        eval_strategy="epoch",
        save_strategy="no",
        report_to="none",
        use_cpu=not torch.cuda.is_available(),
    )

    def metrics(pred):
        logits, labels = pred
        predictions = np.argmax(logits, axis=-1)
        return {
            "macro_f1": float(
                f1_score(labels, predictions, average="macro")
            )
        }

    trainer = Trainer(
        model=model,
        args=args,
        train_dataset=ds_train,
        eval_dataset=ds_valid,
        compute_metrics=metrics,
    )

    trainer.train()

    valid_result = trainer.evaluate(ds_valid)
    test_pred_out = trainer.predict(ds_test)
    test_preds = [LABELS[int(i)] for i in np.argmax(test_pred_out.predictions, axis=-1)]
    test_score = f1_score(test["label"].tolist(), test_preds, average="macro")
    save_evaluation_artifacts(model_id, test["label"].tolist(), test_preds)

    return (
        trainer.model,
        tokenizer,
        output_dir,
    ), round(float(valid_result["eval_macro_f1"]), 4), round(float(test_score), 4)


def save_registry(registry_path, model_id, score):
    registry = json.loads(registry_path.read_text(encoding="utf-8"))
    registry["model"][model_id]["f1_test"] = score

    temp = registry_path.with_suffix(".tmp")
    temp.write_text(
        json.dumps(registry, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    temp.replace(registry_path)


def append_log(row):
    REPORTS.mkdir(parents=True, exist_ok=True)
    path = REPORTS / "retrain_log.csv"

    new = pd.DataFrame([row])
    if path.exists():
        old = pd.read_csv(path)
        new = pd.concat([old, new], ignore_index=True)

    new.to_csv(path, index=False)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--feedback", required=True)
    parser.add_argument(
        "--model",
        default="logreg_tuned",
        choices=[
            "logreg_baseline",
            "logreg_tuned",
            "svm_tuned",
            "nb_tuned",
            "indobert",
            "indobertweet",
        ],
    )
    parser.add_argument("--epochs", type=int, default=1)
    parser.add_argument("--lr", type=float, default=2e-5)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    start = time.time()
    feedback_path = Path(args.feedback)
    if not feedback_path.is_absolute():
        feedback_path = ROOT / feedback_path

    old_score, registry_path = read_registry(args.model)

    original_train, merged_train, feedback_count, net_added = merge_feedback(
        feedback_path
    )

    valid = read_csv_checked(PROCESSED / "valid.csv")
    test = read_csv_checked(PROCESSED / "test.csv")

    print(f"Feedback valid : {feedback_count}")
    print(f"Perubahan bersih data latih: {net_added:+}")
    print(f"Total data latih: {len(merged_train)}")
    print(f"F1 Test lama: {old_score:.4f}")

    if args.model in {"indobert", "indobertweet"}:
        artifact, f1_valid, f1_test = train_transformer(
            args.model, merged_train, valid, test,
            args.epochs, args.lr
        )
    else:
        artifact, f1_valid, f1_test = train_classical(
            args.model, merged_train, valid, test
        )

    promoted = f1_test >= old_score
    status = "DRY_RUN" if args.dry_run else (
        "PROMOTED" if promoted else "REJECTED"
    )

    print(f"F1 Valid baru: {f1_valid:.4f}")
    print(f"F1 Test baru : {f1_test:.4f}")
    print(f"Status       : {status}")

    if not args.dry_run and promoted:
        train_path = PROCESSED / "train.csv"
        backup = PROCESSED / (
            "train.backup." + datetime.now().strftime("%Y%m%d_%H%M%S") + ".csv"
        )

        shutil.copy2(train_path, backup)

        temp_train = train_path.with_suffix(".tmp")
        merged_train.to_csv(temp_train, index=False)
        temp_train.replace(train_path)

        if args.model in {"indobert", "indobertweet"}:
            model_obj, tokenizer, temp_dir = artifact

            targets = [
                MODELS / args.model,
                BACKEND_MODELS / args.model,
            ]

            for target in targets:
                if target.parent.exists():
                    staging = target.parent / f"_{args.model}_staging"
                    if staging.exists():
                        shutil.rmtree(staging)

                    staging.mkdir(parents=True)
                    model_obj.save_pretrained(str(staging))
                    tokenizer.save_pretrained(str(staging))

                    if target.exists():
                        shutil.rmtree(target)

                    staging.rename(target)

            if temp_dir.exists():
                shutil.rmtree(temp_dir, ignore_errors=True)

        else:
            targets = [
                MODELS / f"{args.model}.pkl",
                BACKEND_MODELS / f"{args.model}.pkl",
            ]

            for target in targets:
                if target.parent.exists():
                    temp = target.with_suffix(".tmp")
                    joblib.dump(artifact, temp)
                    temp.replace(target)

        for path in [
            MODELS / "registry.json",
            BACKEND_MODELS / "registry.json",
        ]:
            if path.exists():
                save_registry(path, args.model, f1_test)

        rekap = MODELS / "rekap_hasil.csv"
        if rekap.exists():
            df = pd.read_csv(rekap)
            if {"id", "f1_valid", "f1_test"}.issubset(df.columns):
                df.loc[df["id"] == args.model, "f1_valid"] = f1_valid
                df.loc[df["id"] == args.model, "f1_test"] = f1_test
                df.to_csv(rekap, index=False)

        print("[SAFE DEPLOYMENT GATE: LOLOS] Model berhasil dipromosikan.")

    elif not args.dry_run:
        if args.model in {"indobert", "indobertweet"}:
            temp_dir = artifact[2]
            if temp_dir.exists():
                shutil.rmtree(temp_dir, ignore_errors=True)

        print("[SAFE DEPLOYMENT GATE: DITOLAK] Model lama dipertahankan.")

    append_log({
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "model": args.model,
        "feedback_file": feedback_path.name,
        "feedback_rows": feedback_count,
        "net_added_rows": net_added,
        "total_train_rows": len(merged_train),
        "old_f1_test": old_score,
        "new_f1_valid": f1_valid,
        "new_f1_test": f1_test,
        "status": status,
        "duration_sec": round(time.time() - start, 1),
    })


if __name__ == "__main__":
    main()