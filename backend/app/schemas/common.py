from enum import StrEnum


class SupportedLanguage(StrEnum):
    EN = "en"
    HI = "hi"
    MR = "mr"


class AnalysisStatus(StrEnum):
    CREATED = "created"
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"



class SchemeMatchStatus(StrEnum):
    POTENTIAL_MATCH = "potential_match"
    NOT_MATCHED = "not_matched"
    INSUFFICIENT_INFORMATION = "insufficient_information"


class BeneficiaryCategory(StrEnum):
    SC = "SC"
    ST = "ST"
    OBC = "OBC"
    GENERAL = "General"
    WOMEN = "Women"
    MINORITY = "Minority"
    DIFFERENTLY_ABLED = "Differently Abled"
    EX_SERVICEMEN = "Ex-Servicemen"
