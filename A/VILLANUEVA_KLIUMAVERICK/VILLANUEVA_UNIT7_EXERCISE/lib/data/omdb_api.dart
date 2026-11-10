import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/movie.dart';
import 'api_exception.dart';

class OmdbApi {
  OmdbApi(this.client, {required this.apiKey});

  final http.Client client;
  final String apiKey;

  Future<List<Movie>> search(String query) async {
    final json = await _getJson({'s': query, 'type': 'movie'});
    if (json['Response'] == 'False') {
      final error = json['Error'] as String? ?? 'OMDb error';
      if (error == 'Movie not found!') return const [];
      throw ApiException(error);
    }
    final results = json['Search'] as List<dynamic>? ?? const [];
    return results
        .map((item) => Movie.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<MovieDetails> getDetails(String imdbId) async {
    final json = await _getJson({'i': imdbId, 'plot': 'short'});
    if (json['Response'] == 'False') {
      throw ApiException(json['Error'] as String? ?? 'OMDb error');
    }
    return MovieDetails.fromJson(json);
  }

  Future<Map<String, dynamic>> _getJson(Map<String, String> parameters) async {
    if (apiKey.isEmpty) {
      throw const ApiException(
        'Add your OMDB_KEY to the run configuration to search movies.',
      );
    }
    final uri = Uri.https('www.omdbapi.com', '/', {
      'apikey': apiKey,
      ...parameters,
    });
    try {
      final response = await client
          .get(uri)
          .timeout(const Duration(seconds: 10));
      if (response.statusCode != 200) {
        throw ApiException('OMDb answered ${response.statusCode}.');
      }
      final json = jsonDecode(response.body);
      if (json is! Map<String, dynamic>) {
        throw const ApiException('OMDb returned an unexpected answer.');
      }
      return json;
    } on TimeoutException {
      throw const ApiException('OMDb took too long to answer.');
    } on http.ClientException {
      throw const ApiException(
        'Could not reach OMDb. Check your internet connection.',
      );
    } on FormatException catch (error) {
      throw ApiException('OMDb returned invalid data: ${error.message}');
    }
  }
}
