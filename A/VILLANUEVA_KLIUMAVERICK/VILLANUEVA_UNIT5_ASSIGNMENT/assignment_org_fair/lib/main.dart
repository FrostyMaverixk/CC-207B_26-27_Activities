import 'package:flutter/material.dart';

import 'data/orgs.dart';
import 'screens/org_list_screen.dart';

void main() => runApp(OrgFairApp(repository: OrgRepository()));

// EXPLAIN E1: OrgFairApp is a StatelessWidget but OrgListScreen is a
// StatefulWidget. Use the two questions from the slides to explain why.
class OrgFairApp extends StatelessWidget {
  const OrgFairApp({super.key, required this.repository});

  /// Try other modes while you work, for example:
  /// OrgRepository(mode: ServerMode.error)
  final OrgRepository repository;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'CICT Org Fair',
      // Change the seed color once and every screen follows (Part C).
      theme: ThemeData(colorSchemeSeed: Colors.teal),
      darkTheme: ThemeData(
        colorSchemeSeed: Colors.teal,
        brightness: Brightness.dark,
      ),
      home: OrgListScreen(repository: repository),
    );
  }
}
