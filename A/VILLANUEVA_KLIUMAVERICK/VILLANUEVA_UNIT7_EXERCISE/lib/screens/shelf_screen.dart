import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;

import '../config.dart';
import '../data/omdb_api.dart';
import '../data/open_library_api.dart';
import '../data/pick_source.dart';
import '../models/book.dart';
import '../models/movie.dart';
import '../models/pick.dart';
import '../widgets/state_message.dart';
import 'pick_detail_screen.dart';

class ShelfScreen extends StatefulWidget {
  const ShelfScreen({super.key, required this.pickSource});

  final PickSource pickSource;

  @override
  State<ShelfScreen> createState() => _ShelfScreenState();
}

class _ShelfScreenState extends State<ShelfScreen> {
  late final http.Client _client;
  late final OpenLibraryApi _books;
  late final OmdbApi _movies;

  @override
  void initState() {
    super.initState();
    _client = http.Client();
    _books = OpenLibraryApi(_client);
    _movies = OmdbApi(_client, apiKey: omdbKey);
  }

  @override
  void dispose() {
    _client.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('My Shelf'),
          bottom: const TabBar(
            tabs: [
              Tab(text: 'My Picks'),
              Tab(text: 'Books'),
              Tab(text: 'Movies'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            PicksTab(pickSource: widget.pickSource),
            BookSearchTab(api: _books),
            MovieSearchTab(api: _movies),
          ],
        ),
      ),
    );
  }
}

class BookSearchTab extends StatefulWidget {
  const BookSearchTab({super.key, required this.api});

  final OpenLibraryApi api;

  @override
  State<BookSearchTab> createState() => _BookSearchTabState();
}

class _BookSearchTabState extends State<BookSearchTab> {
  final _controller = TextEditingController();
  Timer? _debounce;
  Future<List<Book>>? _results;

  void _onChanged(String text) {
    _debounce?.cancel();
    final query = text.trim();
    setState(() => _results = null);
    if (query.length < 3) return;
    _debounce = Timer(const Duration(milliseconds: 500), () {
      if (!mounted) return;
      setState(() => _results = widget.api.search(query));
    });
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Column(
    children: [
      _SearchField(
        controller: _controller,
        label: 'Search books',
        onChanged: _onChanged,
      ),
      Expanded(
        child: _results == null
            ? const StateMessage(
                icon: Icons.search,
                text: 'Type at least 3 letters to search Open Library.',
              )
            : FutureBuilder<List<Book>>(
                future: _results,
                builder: (context, snapshot) {
                  if (snapshot.connectionState != ConnectionState.done &&
                      !snapshot.hasData) {
                    return const StateMessage(
                      icon: Icons.hourglass_top,
                      text: 'Searching books...',
                      showSpinner: true,
                    );
                  }
                  if (snapshot.hasError) {
                    return StateMessage(
                      icon: Icons.cloud_off,
                      text: '${snapshot.error}',
                    );
                  }
                  final books = snapshot.data!;
                  if (books.isEmpty) {
                    return const StateMessage(
                      icon: Icons.menu_book_outlined,
                      text: 'Nothing found.',
                    );
                  }
                  return ListView.builder(
                    itemCount: books.length,
                    itemBuilder: (context, index) =>
                        _BookResultTile(book: books[index]),
                  );
                },
              ),
      ),
    ],
  );
}

class MovieSearchTab extends StatefulWidget {
  const MovieSearchTab({super.key, required this.api});

  final OmdbApi api;

  @override
  State<MovieSearchTab> createState() => _MovieSearchTabState();
}

class _MovieSearchTabState extends State<MovieSearchTab> {
  final _controller = TextEditingController();
  Timer? _debounce;
  Future<List<Movie>>? _results;

  void _onChanged(String text) {
    _debounce?.cancel();
    final query = text.trim();
    setState(() => _results = null);
    if (query.length < 3 || omdbKey.isEmpty) return;
    _debounce = Timer(const Duration(milliseconds: 500), () {
      if (!mounted) return;
      setState(() => _results = widget.api.search(query));
    });
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (omdbKey.isEmpty) {
      return const StateMessage(
        icon: Icons.key_off,
        text:
            'Add your free OMDb key with --dart-define=OMDB_KEY=your-key, '
            'then restart the app.',
      );
    }
    return Column(
      children: [
        _SearchField(
          controller: _controller,
          label: 'Search movies',
          onChanged: _onChanged,
        ),
        Expanded(
          child: _results == null
              ? const StateMessage(
                  icon: Icons.search,
                  text: 'Type at least 3 letters to search OMDb.',
                )
              : FutureBuilder<List<Movie>>(
                  future: _results,
                  builder: (context, snapshot) {
                    if (snapshot.connectionState != ConnectionState.done &&
                        !snapshot.hasData) {
                      return const StateMessage(
                        icon: Icons.hourglass_top,
                        text: 'Searching movies...',
                        showSpinner: true,
                      );
                    }
                    if (snapshot.hasError) {
                      return StateMessage(
                        icon: Icons.cloud_off,
                        text: '${snapshot.error}',
                      );
                    }
                    final movies = snapshot.data!;
                    if (movies.isEmpty) {
                      return const StateMessage(
                        icon: Icons.movie_outlined,
                        text: 'Nothing found.',
                      );
                    }
                    return ListView.builder(
                      itemCount: movies.length,
                      itemBuilder: (context, index) =>
                          _MovieResultTile(movie: movies[index]),
                    );
                  },
                ),
        ),
      ],
    );
  }
}

class PicksTab extends StatefulWidget {
  const PicksTab({super.key, required this.pickSource});

  final PickSource pickSource;

  @override
  State<PicksTab> createState() => _PicksTabState();
}

class _PicksTabState extends State<PicksTab> {
  late Future<List<Pick>> _future;

  @override
  void initState() {
    super.initState();
    _future = widget.pickSource.fetchPicks();
  }

  Future<void> _refresh() async {
    late final Future<List<Pick>> request;
    setState(() {
      request = widget.pickSource.fetchPicks();
      _future = request;
    });
    try {
      await request;
    } catch (_) {
      // FutureBuilder displays the failed request.
    }
  }

  @override
  Widget build(BuildContext context) => FutureBuilder<List<Pick>>(
    future: _future,
    builder: (context, snapshot) {
      if (snapshot.connectionState != ConnectionState.done &&
          !snapshot.hasData) {
        return const StateMessage(
          icon: Icons.hourglass_top,
          text: 'Loading your picks...',
          showSpinner: true,
        );
      }
      if (snapshot.hasError) {
        return RefreshIndicator(
          onRefresh: _refresh,
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            children: [
              SizedBox(
                height: 360,
                child: StateMessage(
                  icon: Icons.cloud_off,
                  text: pickSourceError(snapshot.error!),
                  action: FilledButton.icon(
                    onPressed: _refresh,
                    icon: const Icon(Icons.refresh),
                    label: const Text('Try again'),
                  ),
                ),
              ),
            ],
          ),
        );
      }
      final picks = snapshot.data!;
      return RefreshIndicator(
        onRefresh: _refresh,
        child: picks.isEmpty
            ? ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                children: const [
                  SizedBox(
                    height: 360,
                    child: StateMessage(
                      icon: Icons.bookmark_border,
                      text:
                          'No picks yet. Add book and movie picks in your CMS.',
                    ),
                  ),
                ],
              )
            : ListView.builder(
                physics: const AlwaysScrollableScrollPhysics(),
                itemCount: picks.length,
                itemBuilder: (context, index) => _PickTile(pick: picks[index]),
              ),
      );
    },
  );
}

class _SearchField extends StatelessWidget {
  const _SearchField({
    required this.controller,
    required this.label,
    required this.onChanged,
  });

  final TextEditingController controller;
  final String label;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.all(16),
    child: TextField(
      controller: controller,
      onChanged: onChanged,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: const Icon(Icons.search),
        border: const OutlineInputBorder(),
      ),
    ),
  );
}

class _BookResultTile extends StatelessWidget {
  const _BookResultTile({required this.book});

  final Book book;

  @override
  Widget build(BuildContext context) => ListTile(
    leading: _CoverImage(
      url: book.coverId == null
          ? null
          : 'https://covers.openlibrary.org/b/id/${book.coverId}-M.jpg',
      fallback: Icons.menu_book,
    ),
    title: Text(book.title),
    subtitle: Text(
      [
        if (book.authors.isNotEmpty) book.authors.first,
        if (book.year != null) '${book.year}',
      ].join(' • '),
    ),
    trailing: IconButton(
      tooltip: 'Copy book ID',
      icon: const Icon(Icons.copy),
      onPressed: () => _copyId(context, book.workId, 'Book ID'),
    ),
  );
}

class _MovieResultTile extends StatelessWidget {
  const _MovieResultTile({required this.movie});

  final Movie movie;

  @override
  Widget build(BuildContext context) => ListTile(
    leading: _CoverImage(url: movie.posterUrl, fallback: Icons.movie),
    title: Text(movie.title),
    subtitle: Text(movie.year),
    trailing: IconButton(
      tooltip: 'Copy movie ID',
      icon: const Icon(Icons.copy),
      onPressed: () => _copyId(context, movie.imdbId, 'Movie ID'),
    ),
  );
}

class _PickTile extends StatelessWidget {
  const _PickTile({required this.pick});

  final Pick pick;

  @override
  Widget build(BuildContext context) => ListTile(
    leading: Icon(pick.kind == PickKind.book ? Icons.menu_book : Icons.movie),
    title: Text(pick.title),
    subtitle: Text(pick.note),
    isThreeLine: pick.note.contains('\n'),
    onTap: () => Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => PickDetailScreen(pick: pick)),
    ),
  );
}

class _CoverImage extends StatelessWidget {
  const _CoverImage({required this.url, required this.fallback});

  final String? url;
  final IconData fallback;

  @override
  Widget build(BuildContext context) {
    if (url == null) return Icon(fallback, size: 36);
    return Image.network(
      url!,
      width: 48,
      height: 64,
      fit: BoxFit.cover,
      errorBuilder: (context, error, stackTrace) => Icon(fallback, size: 36),
    );
  }
}

void _copyId(BuildContext context, String id, String label) {
  Clipboard.setData(ClipboardData(text: id));
  ScaffoldMessenger.of(
    context,
  ).showSnackBar(SnackBar(content: Text('$label copied: $id')));
}
