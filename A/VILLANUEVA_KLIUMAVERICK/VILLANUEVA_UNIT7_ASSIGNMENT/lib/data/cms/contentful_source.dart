import 'package:http/http.dart' as http;

import '../../models/fair_event.dart';
import '../event_source.dart';

/// Contentful (hosted headless CMS), Content Delivery API.
class ContentfulEventSource implements EventSource {
  ContentfulEventSource(
    this.client, {
    required this.spaceId,
    required this.token,
    this.environment = 'master',
  });

  final http.Client client;
  final String spaceId;

  /// The read-only Content Delivery API token, never a management token.
  final String token;
  final String environment;

  @override
  String get name => 'Contentful';

  @override
  Future<List<FairEvent>> fetchEvents() async {
    final uri = Uri.https(
      'cdn.contentful.com',
      '/spaces/$spaceId/environments/$environment/entries',
      {
        'content_type': 'fairevent',
        'order': 'fields.startsAt',
        'limit': '100',
        'access_token': token,
      },
    );
    final json = await getJson(client, uri, cms: name);

    final items = (json! as Map<String, dynamic>)['items'] as List<dynamic>;
    return items.map((item) {
      final entry = item as Map<String, dynamic>;
      final fields = entry['fields'] as Map<String, dynamic>;
      final sys = entry['sys'] as Map<String, dynamic>;
      return FairEvent(
        id: sys['id'] as String? ?? '',
        orgId: fields['orgId'] as String? ?? '',
        title: fields['title'] as String? ?? '',
        startsAt: DateTime.parse(fields['startsAt'] as String),
        venue: fields['venue'] as String? ?? '',
        description: fields['description'] as String? ?? '',
        cancelled: fields['cancelled'] as bool? ?? false,
      );
    }).toList();
  }
}
