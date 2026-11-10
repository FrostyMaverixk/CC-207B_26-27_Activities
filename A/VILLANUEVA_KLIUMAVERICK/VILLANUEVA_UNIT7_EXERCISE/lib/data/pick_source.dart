import 'package:http/http.dart' as http;

import '../models/pick.dart';
import 'event_source.dart' show CmsException, getJson;

abstract interface class PickSource {
  Future<List<Pick>> fetchPicks();
}

class ContentfulPickSource implements PickSource {
  ContentfulPickSource(
    this.client, {
    required this.spaceId,
    required this.token,
    this.environment = 'master',
  });

  final http.Client client;
  final String spaceId;
  final String token;
  final String environment;

  @override
  Future<List<Pick>> fetchPicks() async {
    final uri = Uri.https(
      'cdn.contentful.com',
      '/spaces/$spaceId/environments/$environment/entries',
      {'content_type': 'pick', 'limit': '100', 'access_token': token},
    );
    final json = await getJson(client, uri, cms: 'Contentful');
    final items = (json! as Map<String, dynamic>)['items'] as List<dynamic>;
    return items.map((item) {
      final entry = item as Map<String, dynamic>;
      final fields = entry['fields'] as Map<String, dynamic>;
      final sys = entry['sys'] as Map<String, dynamic>;
      return _pick(sys['id'] as String? ?? '', fields);
    }).toList();
  }
}

class StrapiPickSource implements PickSource {
  StrapiPickSource(this.client, {required this.baseUrl, this.token = ''});

  final http.Client client;
  final String baseUrl;
  final String token;

  @override
  Future<List<Pick>> fetchPicks() async {
    final uri = Uri.parse(
      '$baseUrl/api/picks',
    ).replace(queryParameters: {'pagination[pageSize]': '100'});
    final headers = <String, String>{};
    if (token.isNotEmpty) headers['Authorization'] = 'Bearer $token';
    final json = await getJson(client, uri, cms: 'Strapi', headers: headers);
    final items = (json! as Map<String, dynamic>)['data'] as List<dynamic>;
    return items.map((item) {
      final entry = item as Map<String, dynamic>;
      final fields = entry['attributes'] as Map<String, dynamic>? ?? entry;
      return _pick(
        entry['documentId'] as String? ?? entry['id']?.toString() ?? '',
        fields,
      );
    }).toList();
  }
}

class SanityPickSource implements PickSource {
  SanityPickSource(
    this.client, {
    required this.projectId,
    this.dataset = 'production',
    this.token = '',
  });

  final http.Client client;
  final String projectId;
  final String dataset;
  final String token;

  static const query =
      '*[_type == "pick"] | order(_createdAt desc) '
      '{_id, title, kind, externalId, note}';

  @override
  Future<List<Pick>> fetchPicks() async {
    final uri = Uri.https(
      '$projectId.apicdn.sanity.io',
      '/v2025-02-19/data/query/$dataset',
      {'query': query},
    );
    final headers = <String, String>{};
    if (token.isNotEmpty) headers['Authorization'] = 'Bearer $token';
    final json = await getJson(client, uri, cms: 'Sanity', headers: headers);
    final items = (json! as Map<String, dynamic>)['result'] as List<dynamic>;
    return items.map((item) {
      final entry = item as Map<String, dynamic>;
      return _pick(entry['_id'] as String? ?? '', entry);
    }).toList();
  }
}

Pick _pick(String id, Map<String, dynamic> fields) => Pick(
  id: id,
  title: fields['title'] as String? ?? '',
  kind: PickKind.parse(fields['kind'] as String? ?? ''),
  externalId: fields['externalId'] as String? ?? '',
  note: fields['note'] as String? ?? '',
);

class EmptyPickSource implements PickSource {
  const EmptyPickSource();

  @override
  Future<List<Pick>> fetchPicks() async => const [];
}

String pickSourceError(Object error) =>
    error is CmsException ? error.message : '$error';
