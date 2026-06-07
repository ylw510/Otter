from app.services.prompt_loader import get_prompt_loader


def test_rewrite_prompt_contains_styles_and_text():
    text = "hello world"
    styles = ["professional", "native"]
    p = get_prompt_loader().render_rewrite(text, styles)
    assert "professional" in p
    assert "native" in p
    assert text in p


def test_explain_prompt_without_sentence():
    p = get_prompt_loader().render_explain("foo", "")
    assert "foo" in p


def test_explain_prompt_with_sentence():
    p = get_prompt_loader().render_explain("bar", "Bar is here.")
    assert "bar" in p
    assert "Bar is here" in p


def test_translate_prompt_without_sentence():
    p = get_prompt_loader().render_translate("hello", "")
    assert "hello" in p


def test_translate_prompt_with_sentence():
    p = get_prompt_loader().render_translate("world", "Hello world.")
    assert "world" in p
    assert "Hello world" in p
