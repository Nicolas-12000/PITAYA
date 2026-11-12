class PitayaError(Exception):
    """Base error for domain and platform."""


class SnapshotNotFoundError(PitayaError):
    """Raised when the versioned snapshot is missing on disk."""


class DataValidationError(PitayaError):
    """Raised when ingested data fails schema checks."""
