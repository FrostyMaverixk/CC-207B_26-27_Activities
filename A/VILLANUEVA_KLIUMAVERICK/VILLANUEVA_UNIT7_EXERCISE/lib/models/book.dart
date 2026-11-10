class Book {
  const Book({
    required this.workId,
    required this.title,
    required this.authors,
    required this.year,
    required this.coverId,
  });

  final String workId;
  final String title;
  final List<String> authors;
  final int? year;
  final int? coverId;

  factory Book.fromJson(Map<String, dynamic> json) => Book(
    workId: (json['key'] as String).split('/').last,
    title: json['title'] as String? ?? 'Untitled',
    authors: [...?(json['author_name'] as List<dynamic>?)?.cast<String>()],
    year: json['first_publish_year'] as int?,
    coverId: json['cover_i'] as int?,
  );
}

class BookDetails {
  const BookDetails({
    required this.title,
    required this.description,
    required this.coverId,
  });

  final String title;
  final String description;
  final int? coverId;

  factory BookDetails.fromJson(Map<String, dynamic> json) {
    final description = switch (json['description']) {
      final String text => text,
      {'value': final String text} => text,
      _ => 'No description yet.',
    };
    final covers = (json['covers'] as List<dynamic>?)
        ?.whereType<int>()
        .toList();
    return BookDetails(
      title: json['title'] as String? ?? 'Untitled',
      description: description,
      coverId: covers == null || covers.isEmpty ? null : covers.first,
    );
  }
}
