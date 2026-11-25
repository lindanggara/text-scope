import gradio as gr
from main import app as fastapi_app

with gr.Blocks(title="TextScope API") as demo:
    gr.Markdown(
        "# TextScope API Backend\n"
        "Server FastAPI aktif. Gunakan endpoint `/health`, `/predict`, `/analyze`, dan `/admin/*`."
    )

app = gr.mount_gradio_app(fastapi_app, demo, path="/ui")