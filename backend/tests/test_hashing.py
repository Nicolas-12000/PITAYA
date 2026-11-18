import gzip
from pathlib import Path

from pitaya.kernel.hashing import csv_content_hash

ROWS = b"ad_id,Spent\n1,1.5\n2,0.0\n"


def _gz(path: Path, data: bytes, mtime: int) -> Path:
    with gzip.GzipFile(path, "wb", mtime=mtime) as out:
        out.write(data)
    return path


def test_plain_and_gzip_share_the_content_hash(tmp_path: Path) -> None:
    plain = tmp_path / "ads.csv"
    plain.write_bytes(ROWS)
    gz = _gz(tmp_path / "ads.csv.gz", ROWS, mtime=123)
    assert csv_content_hash(plain) == csv_content_hash(gz)


def test_gzip_timestamp_does_not_change_the_hash(tmp_path: Path) -> None:
    a = _gz(tmp_path / "a.csv.gz", ROWS, mtime=1)
    b = _gz(tmp_path / "b.csv.gz", ROWS, mtime=2)
    assert a.read_bytes() != b.read_bytes()
    assert csv_content_hash(a) == csv_content_hash(b)


def test_line_endings_do_not_change_the_hash(tmp_path: Path) -> None:
    lf = tmp_path / "lf.csv"
    crlf = tmp_path / "crlf.csv"
    lf.write_bytes(ROWS)
    crlf.write_bytes(ROWS.replace(b"\n", b"\r\n"))
    assert csv_content_hash(lf) == csv_content_hash(crlf)


def test_different_rows_change_the_hash(tmp_path: Path) -> None:
    a = tmp_path / "a.csv"
    b = tmp_path / "b.csv"
    a.write_bytes(ROWS)
    b.write_bytes(ROWS + b"3,2.0\n")
    assert csv_content_hash(a) != csv_content_hash(b)
