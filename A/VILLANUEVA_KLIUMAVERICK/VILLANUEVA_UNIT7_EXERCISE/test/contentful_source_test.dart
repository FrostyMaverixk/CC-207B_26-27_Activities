// Only for students who chose Contentful.
// Run: flutter test test/contentful_source_test.dart
import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:org_fair/data/cms/contentful_source.dart';

final contentfulAnswer = jsonEncode({
  'sys': {'type': 'Array'},
  'total': 3,
  'skip': 0,
  'limit': 100,
  'items': [
    {
      'sys': {'id': '3xYzHourOfCode', 'type': 'Entry'},
      'fields': {
        'title': 'Hour of Code',
        'orgId': 'csc',
        'startsAt': '2026-11-08T13:00+08:00',
        'venue': 'CICT Lab 2',
        'description': 'No experience needed.',
        'cancelled': false,
      },
    },
    {
      'sys': {'id': '5PhotoWalk', 'type': 'Entry'},
      'fields': {
        'title': 'Photo Walk',
        'orgId': 'pixel',
        'startsAt': '2026-11-10T06:00+08:00',
        'venue': 'Calle Real',
        'cancelled': true,
      },
    },
    {
      'sys': {'id': '7OpenJam', 'type': 'Entry'},
      'fields': {
        'title': 'Open Jam',
        'orgId': 'tunog',
        'startsAt': '2026-11-14T17:00+08:00',
        'venue': 'Quadrangle',
      },
    },
  ],
});

void main() {
  test(
    'Contentful request uses the configured space, type, and token',
    () async {
      late http.Request sent;
      final client = MockClient((request) async {
        sent = request;
        return http.Response(contentfulAnswer, 200);
      });

      await ContentfulEventSource(
        client,
        spaceId: 'abc123',
        token: 'delivery-token',
      ).fetchEvents();
      expect(sent.method, 'GET');
      expect(sent.url.host, 'cdn.contentful.com');
      expect(sent.url.path, '/spaces/abc123/environments/master/entries');
      expect(sent.url.queryParameters['content_type'], 'fairevent');
      expect(sent.url.queryParameters['order'], 'fields.startsAt');
      expect(sent.url.queryParameters['access_token'], 'delivery-token');
      expect(sent.url.queryParameters['limit'], '100');
    },
  );

  test('Contentful JSON is mapped to fair events', () async {
    final client = MockClient(
      (request) async => http.Response(contentfulAnswer, 200),
    );
    final events = await ContentfulEventSource(
      client,
      spaceId: 'abc123',
      token: 't',
    ).fetchEvents();

    expect(events, hasLength(3));
    final first = events[0];
    expect(first.id, '3xYzHourOfCode');
    expect(first.orgId, 'csc');
    expect(first.title, 'Hour of Code');
    expect(first.startsAt.toUtc(), DateTime.utc(2026, 11, 8, 5));
    expect(first.venue, 'CICT Lab 2');
    expect(first.description, 'No experience needed.');
    expect(first.cancelled, isFalse);
    expect(events[1].cancelled, isTrue);
    expect(events[1].description, '', reason: 'A missing field means empty');
    expect(events[2].cancelled, isFalse, reason: 'A missing field means false');
  });
}
