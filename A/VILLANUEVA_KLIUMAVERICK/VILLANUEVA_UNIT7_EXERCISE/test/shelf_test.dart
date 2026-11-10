import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:org_fair/data/api_exception.dart';
import 'package:org_fair/data/omdb_api.dart';
import 'package:org_fair/data/open_library_api.dart';
import 'package:org_fair/data/pick_source.dart';
import 'package:org_fair/models/book.dart';
import 'package:org_fair/models/pick.dart';
import 'package:org_fair/screens/shelf_screen.dart';

import 'helpers.dart';

void main() {
  group('Open Library', () {
    test(
      'search builds an encoded request and tolerates missing fields',
      () async {
        final client = MockClient((request) async {
          expect(request.url.host, 'openlibrary.org');
          expect(request.url.path, '/search.json');
          expect(request.url.queryParameters['q'], 'the hobbit');
          expect(request.url.queryParameters['limit'], '20');
          return http.Response(
            jsonEncode({
              'docs': [
                {
                  'key': '/works/OL27482W',
                  'title': 'The Hobbit',
                  'first_publish_year': 1937,
                },
              ],
            }),
            200,
          );
        });

        final books = await OpenLibraryApi(client).search('the hobbit');

        expect(books.single.workId, 'OL27482W');
        expect(books.single.authors, isEmpty);
        expect(books.single.coverId, isNull);
      },
    );

    test('details accepts both description shapes', () async {
      final descriptions = [
        'A book.',
        {'value': 'Another book.'},
      ];
      final client = MockClient((request) async {
        final index = request.url.pathSegments.last == 'one.json' ? 0 : 1;
        return http.Response(
          jsonEncode({
            'title': 'Book $index',
            'description': descriptions[index],
            'covers': [42],
          }),
          200,
        );
      });

      final stringDescription = await OpenLibraryApi(client).getDetails('one');
      final mapDescription = await OpenLibraryApi(client).getDetails('two');

      expect(stringDescription.description, 'A book.');
      expect(mapDescription.description, 'Another book.');
      expect(mapDescription.coverId, 42);
    });
  });

  group('OMDb', () {
    test(
      'not-found response is an empty result and N/A has no poster',
      () async {
        var noResults = true;
        final client = MockClient((request) async {
          expect(request.url.queryParameters['apikey'], 'test-key');
          if (noResults) {
            noResults = false;
            return http.Response(
              jsonEncode({'Response': 'False', 'Error': 'Movie not found!'}),
              200,
            );
          }
          return http.Response(
            jsonEncode({
              'Search': [
                {
                  'Title': 'A Movie',
                  'Year': '2024',
                  'imdbID': 'tt123',
                  'Poster': 'N/A',
                },
              ],
              'Response': 'True',
            }),
            200,
          );
        });
        final api = OmdbApi(client, apiKey: 'test-key');

        expect(await api.search('unknown'), isEmpty);
        final movies = await api.search('movie');
        expect(movies.single.posterUrl, isNull);
        expect(movies.single.imdbId, 'tt123');
      },
    );

    test('API-key errors are surfaced', () async {
      final client = MockClient(
        (_) async => http.Response(
          jsonEncode({'Response': 'False', 'Error': 'Invalid API key!'}),
          200,
        ),
      );

      await expectLater(
        OmdbApi(client, apiKey: 'wrong').search('movie'),
        throwsA(isA<ApiException>()),
      );
    });
  });

  test('Contentful picks map CMS fields into the app model', () async {
    final client = MockClient((request) async {
      expect(request.url.queryParameters['content_type'], 'pick');
      return http.Response(
        jsonEncode({
          'items': [
            {
              'sys': {'id': 'entry-1'},
              'fields': {
                'title': 'The Hobbit',
                'kind': 'book',
                'externalId': 'OL27482W',
                'note': 'A favorite.',
              },
            },
          ],
        }),
        200,
      );
    });

    final picks = await ContentfulPickSource(
      client,
      spaceId: 'space',
      token: 'token',
    ).fetchPicks();

    expect(picks.single.kind, PickKind.book);
    expect(picks.single.externalId, 'OL27482W');
    expect(picks.single.note, 'A favorite.');
  });

  test('Strapi picks use the Strapi collection and bearer token', () async {
    final client = MockClient((request) async {
      expect(request.url.path, '/api/picks');
      expect(request.url.queryParameters['pagination[pageSize]'], '100');
      expect(request.headers['Authorization'], 'Bearer read-token');
      return http.Response(
        jsonEncode({
          'data': [
            {
              'documentId': 'entry-2',
              'title': 'A Movie',
              'kind': 'movie',
              'externalId': 'tt123',
              'note': 'Watch it.',
            },
          ],
        }),
        200,
      );
    });

    final picks = await StrapiPickSource(
      client,
      baseUrl: 'https://cms.example',
      token: 'read-token',
    ).fetchPicks();

    expect(picks.single.kind, PickKind.movie);
    expect(picks.single.id, 'entry-2');
  });

  test('Sanity picks request the pick documents', () async {
    final client = MockClient((request) async {
      expect(request.url.host, 'project.apicdn.sanity.io');
      expect(request.url.queryParameters['query'], contains('_type == "pick"'));
      return http.Response(
        jsonEncode({
          'result': [
            {
              '_id': 'entry-3',
              'title': 'A Book',
              'kind': 'book',
              'externalId': 'OL1W',
              'note': 'Read it.',
            },
          ],
        }),
        200,
      );
    });

    final picks = await SanityPickSource(
      client,
      projectId: 'project',
    ).fetchPicks();

    expect(picks.single.id, 'entry-3');
    expect(picks.single.externalId, 'OL1W');
  });

  testWidgets('Shelf exposes its three tabs and displays CMS picks', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(home: ShelfScreen(pickSource: _FakePickSource())),
    );
    await tester.pumpAndSettle();

    expect(find.text('My Picks'), findsOneWidget);
    expect(find.text('Books'), findsOneWidget);
    expect(find.text('Movies'), findsOneWidget);
    expect(find.text('The Hobbit'), findsOneWidget);
    expect(find.text('A favorite.'), findsOneWidget);

    await tester.tap(find.text('Books'));
    await tester.pumpAndSettle();
    expect(
      find.text('Type at least 3 letters to search Open Library.'),
      findsOneWidget,
    );

    await tester.tap(find.text('Movies'));
    await tester.pumpAndSettle();
    expect(find.textContaining('Add your free OMDb key'), findsOneWidget);
  });

  testWidgets('My Shelf is reachable without removing existing tabs', (
    tester,
  ) async {
    await openApp(tester);
    await tapDestination(tester, 'My Shelf');

    expect(find.text('My Picks'), findsOneWidget);
    expect(
      find.descendant(
        of: find.byType(NavigationBar),
        matching: find.text('Schedule'),
      ),
      findsOneWidget,
    );
  });

  test('book detail parser defaults missing description and covers', () {
    final details = BookDetails.fromJson({'title': 'A Book'});

    expect(details.description, 'No description yet.');
    expect(details.coverId, isNull);
  });
}

class _FakePickSource implements PickSource {
  @override
  Future<List<Pick>> fetchPicks() async => const [
    Pick(
      id: 'pick-1',
      title: 'The Hobbit',
      kind: PickKind.book,
      externalId: 'OL27482W',
      note: 'A favorite.',
    ),
  ];
}
