import os
import streamlit as st
import streamlit.components.v1 as components

# Streamlit Page Configuration
st.set_page_config(
    page_title="Cryogenic Quantum Lab",
    page_icon="⚛️",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Custom CSS to hide Streamlit header/footer and provide full-bleed dark theme
st.markdown("""
<style>
    /* Hide Streamlit branding and extra padding */
    #MainMenu {visibility: hidden;}
    header {visibility: hidden;}
    footer {visibility: hidden;}
    .block-container {
        padding: 0 !important;
        margin: 0 !important;
        max-width: 100% !important;
    }
    iframe {
        border: none !important;
        width: 100% !important;
        min-height: 100vh !important;
    }
</style>
""", unsafe_allow_html=True)

def load_bundled_app():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    quiz_dir = os.path.join(base_dir, "quiz-app")
    if not os.path.exists(quiz_dir):
        quiz_dir = base_dir

    html_path = os.path.join(quiz_dir, "index.html")
    questions_path = os.path.join(quiz_dir, "questions.js")
    app_path = os.path.join(quiz_dir, "app.js")

    with open(html_path, "r", encoding="utf-8") as f:
        html = f.read()

    with open(questions_path, "r", encoding="utf-8") as f:
        questions_js = f.read()

    with open(app_path, "r", encoding="utf-8") as f:
        app_js = f.read()

    # Inline scripts to ensure 100% self-contained execution on Streamlit Community Cloud
    html = html.replace('<script src="questions.js"></script>', f'<script>\n{questions_js}\n</script>')
    html = html.replace('<script src="app.js"></script>', f'<script>\n{app_js}\n</script>')

    return html

app_html = load_bundled_app()

# Render full-bleed interactive web app inside Streamlit
components.html(app_html, height=960, scrolling=True)
