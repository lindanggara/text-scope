import os
import logging
import traceback
import gradio as gr
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("textscope-space")

try:
    from main import app as fastapi_app
except Exception:
    logger.error("Gagal mengimpor main.py:\n%s", traceback.format_exc())
    raise

with gr.Blocks(title="TextScope API") as demo:
    gr.Markdown(
        "# TextScope API Backend\n"
        "Server FastAPI aktif. Gunakan endpoint `/health`, `/predict`, `/analyze`, dan `/admin/*`."
    )

# Pasang route FastAPI ke app internal Gradio agar Gradio SDK tetap menangani lifecycle & healthcheck Space
app = gr.mount_gradio_app(fastapi_app, demo, path="/")

if __name__ == "__main__":
    os.environ["GRADIO_SERVER_NAME"] = "0.0.0.0"
    os.environ["GRADIO_SERVER_PORT"] = os.environ.get("PORT", "7860")
    demo.launch(
        server_name="0.0.0.0",
        server_port=int(os.environ.get("PORT", "7860")),
        prevent_thread_lock=False,
    )