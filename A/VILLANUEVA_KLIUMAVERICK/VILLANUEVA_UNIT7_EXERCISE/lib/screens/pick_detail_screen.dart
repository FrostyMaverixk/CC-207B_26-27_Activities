import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import '../config.dart';
import '../data/omdb_api.dart';
import '../data/open_library_api.dart';
import '../models/book.dart';
import '../models/movie.dart';
import '../models/pick.dart';
import '../widgets/state_message.dart';

class PickDetailScreen extends StatefulWidget {
  const PickDetailScreen({super.key, required this.pick});

  final Pick pick;

  @override
  State<PickDetailScreen> createState() => _PickDetailScreenState();
}

class _PickDetailScreenState extends State<PickDetailScreen> {
  late final http.Client _client;
  late final Future<Object> _future;

  @override
  void initState() {
    super.initState();
    _client = http.Client();
    _future = switch (widget.pick.kind) {
      PickKind.book => OpenLibraryApi(
        _client,
      ).getDetails(widget.pick.externalId),
      PickKind.movie => OmdbApi(
        _client,
        apiKey: omdbKey,
      ).getDetails(widget.pick.externalId),
    };
  }

  @override
  void dispose() {
    _client.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: Text(widget.pick.title)),
    body: FutureBuilder<Object>(
      future: _future,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done &&
            !snapshot.hasData) {
          return const StateMessage(
            icon: Icons.hourglass_top,
            text: 'Loading details...',
            showSpinner: true,
          );
        }
        if (snapshot.hasError) {
          return StateMessage(icon: Icons.cloud_off, text: '${snapshot.error}');
        }
        return switch (snapshot.data) {
          final BookDetails details => _details(
            title: details.title,
            summary: details.description,
            imageUrl: details.coverId == null
                ? null
                : 'https://covers.openlibrary.org/b/id/${details.coverId}-L.jpg',
            fallback: Icons.menu_book,
          ),
          final MovieDetails details => _details(
            title: details.title,
            summary: details.plot,
            imageUrl: details.posterUrl,
            fallback: Icons.movie,
            metadata: details.year,
          ),
          _ => const StateMessage(
            icon: Icons.error_outline,
            text: 'The API returned no details.',
          ),
        };
      },
    ),
  );

  Widget _details({
    required String title,
    required String summary,
    required String? imageUrl,
    required IconData fallback,
    String? metadata,
  }) => SingleChildScrollView(
    padding: const EdgeInsets.all(24),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Center(
          child: imageUrl == null
              ? Icon(fallback, size: 120)
              : Image.network(
                  imageUrl,
                  height: 260,
                  fit: BoxFit.contain,
                  errorBuilder: (context, error, stackTrace) =>
                      Icon(fallback, size: 120),
                ),
        ),
        const SizedBox(height: 24),
        Text(title, style: Theme.of(context).textTheme.headlineSmall),
        if (metadata != null) ...[
          const SizedBox(height: 4),
          Text(metadata, style: Theme.of(context).textTheme.titleMedium),
        ],
        const SizedBox(height: 16),
        Text(widget.pick.note, style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 24),
        Text(summary, style: Theme.of(context).textTheme.bodyLarge),
      ],
    ),
  );
}
