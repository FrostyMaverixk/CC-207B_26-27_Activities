import 'package:flutter/material.dart';

import 'data/orgs.dart';
import 'screens/about_screen.dart';
import 'screens/home_shell.dart';

void main() => runApp(OrgFairApp(repository: OrgRepository()));

class OrgFairApp extends StatelessWidget {
  const OrgFairApp({super.key, required this.repository});

  /// Try other modes while you work, for example:
  /// OrgRepository(mode: ServerMode.error)
  final OrgRepository repository;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'CICT Org Fair',
      theme: ThemeData(colorSchemeSeed: Colors.teal),
      darkTheme: ThemeData(
        colorSchemeSeed: Colors.teal,
        brightness: Brightness.dark,
      ),
      home: HomeShell(repository: repository),
      // Named routes: screens you can open by name with pushNamed.
      routes: {AboutScreen.routeName: (_) => const AboutScreen()},
    );
  }
}
