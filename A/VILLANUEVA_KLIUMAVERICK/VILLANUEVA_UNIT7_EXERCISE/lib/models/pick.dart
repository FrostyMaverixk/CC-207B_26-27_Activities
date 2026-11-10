enum PickKind {
  book,
  movie;

  static PickKind parse(String value) => switch (value.toLowerCase()) {
    'book' => PickKind.book,
    'movie' => PickKind.movie,
    _ => throw FormatException('Unknown pick kind: $value'),
  };
}

class Pick {
  const Pick({
    required this.id,
    required this.title,
    required this.kind,
    required this.externalId,
    required this.note,
  });

  final String id;
  final String title;
  final PickKind kind;
  final String externalId;
  final String note;
}
