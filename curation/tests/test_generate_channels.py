"""Guards against worker/channels.generated.js silently going stale after a
curation/channels.yaml edit whose author forgot to re-run
worker/generate_channels.py (ticket #113's code review flagged this as an
unenforced manual step — see worker/README.md's "Regenerating the
known-channel list"). Compares the real committed file's content against
what the generator would produce right now from the real channels.yaml.
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / "worker"))

import generate_channels  # noqa: E402
import pipeline  # noqa: E402

GENERATED_FILE = ROOT / "worker" / "channels.generated.js"


def test_committed_channels_generated_js_matches_the_real_channels_yaml():
    expected = generate_channels.render(pipeline.load_channel_display_names())
    assert GENERATED_FILE.read_text() == expected, (
        "worker/channels.generated.js is stale — run "
        "`python3 worker/generate_channels.py` and commit the result."
    )
