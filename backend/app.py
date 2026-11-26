import os
import sys
import logging
import traceback
import gradio as gr

logging.basicConfig(level=logging.INFO, stream=sys.stdout)
logger = logging.getLogger("textscope-space")
logger.info("Mulai memuat app.py...")

try:
    from main import app as fastapi_app
    logger.info("Berhasil mengimpor main.py")
except Exception:
    logger.error("Gagal mengimpor main.py:\n%s", traceback.format_exc())
    raise

with gr.Blocks(title="TextScope API") as demo:
    gr.Markdown(
        "# TextScope API Backend\n"
        "Server FastAPI aktif. Gunakan endpoint `/health`, `/predict`, `/analyze`, dan `/admin/*`."
    )

app = gr.mount_gradio_app(fastapi_app, demo, path="/ui")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "7860"))
    logger.info("Menjalankan demo.launch pada port %s...", port)
    demo.launch(server_name="0.0.0.0", server_port=port)