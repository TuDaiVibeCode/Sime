"""Music-theory helpers, kept consistent with backend/src/services/vocalAnalysis.ts."""
import math
import re

NOTE_TO_SEMITONE = {
    "C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5,
    "F#": 6, "Gb": 6, "G": 7, "G#": 8, "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11,
}
SEMITONE_TO_NOTE = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

_NOTE_RE = re.compile(r"^([A-G])(#|b)?(-?\d)$")


def note_to_midi(note: str) -> int:
    match = _NOTE_RE.match(note.strip())
    if not match:
        raise ValueError(f"Invalid note: {note}")
    pitch_class = f"{match.group(1)}{match.group(2) or ''}"
    octave = int(match.group(3))
    return (octave + 1) * 12 + NOTE_TO_SEMITONE[pitch_class]


def midi_to_note(midi: int) -> str:
    pitch_class = SEMITONE_TO_NOTE[((midi % 12) + 12) % 12]
    octave = midi // 12 - 1
    return f"{pitch_class}{octave}"


def hz_to_midi_float(freq: float) -> float:
    return 69.0 + 12.0 * math.log2(freq / 440.0)


def hz_to_note_cents(freq: float):
    """Return (note_name, cents_offset) for a frequency in Hz."""
    midi_float = hz_to_midi_float(freq)
    midi = round(midi_float)
    cents = round((midi_float - midi) * 100)
    return midi_to_note(midi), cents
