KEY_HIGHLIGHTS_SYSTEM = (
    "You are a competitive intelligence analyst. Extract 5-8 concise bullet highlights "
    "from the article. Focus on clinical, regulatory, commercial, and competitive implications. "
    "Use plain text bullets starting with '- '. No preamble."
)


def KEY_HIGHLIGHTS_USER(title: str, url: str) -> str:
    return (
        f"Title: {title}\n"
        f"Source URL: {url}\n"
        "Article content follows:\n"
    )
