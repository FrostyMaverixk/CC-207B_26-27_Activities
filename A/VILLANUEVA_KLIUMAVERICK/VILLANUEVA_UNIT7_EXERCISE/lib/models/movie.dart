class Movie {
  const Movie({
    required this.imdbId,
    required this.title,
    required this.year,
    required this.posterUrl,
  });

  final String imdbId;
  final String title;
  final String year;
  final String? posterUrl;

  factory Movie.fromJson(Map<String, dynamic> json) => Movie(
    imdbId: json['imdbID'] as String,
    title: json['Title'] as String? ?? 'Untitled',
    year: json['Year'] as String? ?? '',
    posterUrl: switch (json['Poster']) {
      final String url when url.isNotEmpty && url != 'N/A' => url,
      _ => null,
    },
  );
}

class MovieDetails {
  const MovieDetails({
    required this.title,
    required this.year,
    required this.plot,
    required this.posterUrl,
  });

  final String title;
  final String year;
  final String plot;
  final String? posterUrl;

  factory MovieDetails.fromJson(Map<String, dynamic> json) => MovieDetails(
    title: json['Title'] as String? ?? 'Untitled',
    year: json['Year'] as String? ?? '',
    plot: json['Plot'] as String? ?? 'No plot available.',
    posterUrl: switch (json['Poster']) {
      final String url when url.isNotEmpty && url != 'N/A' => url,
      _ => null,
    },
  );
}
