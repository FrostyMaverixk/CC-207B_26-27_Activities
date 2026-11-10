import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import 'config.dart';
import 'data/event_repository.dart';
import 'data/orgs.dart';
import 'data/pick_source.dart';
import 'screens/about_screen.dart';
import 'screens/home_shell.dart';

void main() => runApp(_createApp());

OrgFairApp _createApp() {
  final client = http.Client();
  return OrgFairApp(
    repository: OrgRepository(),
    events: EventRepository(createEventSource(client)),
    picks: createPickSource(client),
  );
}

class OrgFairApp extends StatelessWidget {
  const OrgFairApp({
    super.key,
    required this.repository,
    required this.events,
    this.picks,
  });

  /// Try other modes while you work, for example:
  /// OrgRepository(mode: ServerMode.error)
  final OrgRepository repository;

  /// Where the events come from: your CMS, or the built-in samples.
  /// See config.dart.
  final EventRepository events;
  final PickSource? picks;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'CICT Org Fair',
      theme: ThemeData(colorSchemeSeed: Colors.teal),
      darkTheme: ThemeData(
        colorSchemeSeed: Colors.teal,
        brightness: Brightness.dark,
      ),
      home: HomeShell(repository: repository, events: events, picks: picks),
      // Named routes: screens you can open by name with pushNamed.
      routes: {AboutScreen.routeName: (_) => const AboutScreen()},
    );
  }
}
