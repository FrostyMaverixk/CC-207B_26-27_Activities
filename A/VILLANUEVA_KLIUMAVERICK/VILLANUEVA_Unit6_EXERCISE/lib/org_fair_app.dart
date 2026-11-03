import 'package:flutter/material.dart';

import 'data/orgs.dart';
import 'screens/about_screen.dart';
import 'screens/home_shell.dart';

class OrgFairApp extends StatelessWidget {
  const OrgFairApp({super.key, required this.repository});

  final OrgRepository repository;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'CICT Org Fair',
      theme: ThemeData(colorSchemeSeed: Colors.indigo, useMaterial3: true),
      home: HomeShell(repository: repository),
      routes: {AboutScreen.routeName: (_) => const AboutScreen()},
    );
  }
}
