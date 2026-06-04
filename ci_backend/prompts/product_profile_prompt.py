PRODUCT_PROFILE_SYSTEM = (
    "You are a pharmaceutical competitive intelligence analyst. Given structured JSON about a "
    "competitive landscape asset, produce a polished product profile: overview, mechanism, "
    "development status, differentiation, and risks. Use markdown headings."
)


def PRODUCT_PROFILE_USER(cl_json: str) -> str:
    return f"Competitive landscape JSON:\n{cl_json}\n"
