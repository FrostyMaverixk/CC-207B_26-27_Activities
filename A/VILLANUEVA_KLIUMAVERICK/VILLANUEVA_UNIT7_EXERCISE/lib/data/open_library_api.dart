import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/book.dart';
import 'api_exception.dart';

class OpenLibraryApi {
  OpenLibraryApi(this.client);

  final http.Client client;

  Future<List<Book>> search(String query) async {
    final uri = Uri.https('openlibrary.org', '/search.json', {
      'q': query,
      'fields': 'key,title,author_name,first_publish_year,cover_i',
      'limit': '20',
    });
    final json = await _getJson(uri);
    final docs = json['docs'] as List<dynamic>? ?? const [];
    return docs
        .map((item) => Book.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<BookDetails> getDetails(String workId) async {
    final json = await _getJson(
      Uri.https('openlibrary.org', '/works/$workId.json'),
    );
    return BookDetails.fromJson(json);
  }

  Future<Map<String, dynamic>> _getJson(Uri uri) async {
    try {
      final response = await client
          .get(uri)
          .timeout(const Duration(seconds: 10));
      if (response.statusCode != 200) {
        throw ApiException('Open Library answered ${response.statusCode}.');
      }
      final json = jsonDecode(response.body);
      if (json is! Map<String, dynamic>) {
        throw const ApiException('Open Library returned an unexpected answer.');
      }
      return json;
    } on TimeoutException {
      throw const ApiException('Open Library took too long to answer.');
    } on http.ClientException {
      throw const ApiException(
        'Could not reach Open Library. Check your internet connection.',
      );
    } on FormatException catch (error) {
      throw ApiException(
        'Open Library returned invalid data: ${error.message}',
      );
    }
  }
}
