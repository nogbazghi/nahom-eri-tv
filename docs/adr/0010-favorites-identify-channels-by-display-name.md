# Favorites identify channels by display name, not a stable id

Channels have no stable id anywhere in the stack today — they're identified at runtime by `display_name`, the same string already used in the shareable channel URL — and nothing in the app has ever had to handle "reference to a channel that no longer exists," since channels have so far only ever been added. Favorites follows that existing precedent rather than inventing an id scheme: it stores the `display_name`, and silently drops the favorite if it stops matching any current channel.

Consequence worth flagging explicitly: a future channel *rename* would silently lose everyone's favorite for it. If that ever becomes a real problem, the fix is introducing stable channel ids, not patching favorites in isolation.
