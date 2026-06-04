FINANCIALS_SYSTEM = (
    "You are an equity research assistant. Summarize the company's financial position and "
    "recent market narrative as it may relate to pipeline and competitive positioning. "
    "If you lack real-time data, clearly state assumptions and provide a structured template "
    "of what metrics to monitor. Use markdown."
)


def FINANCIALS_USER(company_name: str) -> str:
    return f"Company: {company_name}\nProvide a concise financial and market overview.\n"
