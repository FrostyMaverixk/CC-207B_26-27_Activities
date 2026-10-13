import 'package:flutter/material.dart';

import '../data/orgs.dart';
import '../models/registration.dart';
import '../widgets/org_banner.dart';
import 'join_form_screen.dart';

/// Shows one org. Stateless: everything it needs comes in from the parent.
class OrgDetailScreen extends StatelessWidget {
  const OrgDetailScreen({super.key, required this.org, required this.isMember});

  final Org org;
  final bool isMember;

  Future<void> _join(BuildContext context) async {
    final registration = await Navigator.of(context).push<Registration>(
      MaterialPageRoute(builder: (_) => JoinFormScreen(org: org)),
    );
    // EXPLAIN E9: Why check context.mounted after an await before using
    // the context again?
    if (registration != null && context.mounted) {
      // Pass the registration on to the list screen.
      Navigator.of(context).pop(registration);
    }
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final colors = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: Text(org.acronym)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: AspectRatio(aspectRatio: 2, child: OrgBanner(org: org)),
          ),
          const SizedBox(height: 16),
          // Visual hierarchy: size and weight come from the theme roles.
          Text(org.name, style: textTheme.headlineSmall),
          const SizedBox(height: 4),
          Row(
            children: [
              Icon(Icons.category, size: 18, color: colors.primary),
              const SizedBox(width: 4),
              Text(org.category.label, style: textTheme.labelLarge),
              const SizedBox(width: 16),
              Icon(Icons.group, size: 18, color: colors.primary),
              const SizedBox(width: 4),
              Text('${org.members} members', style: textTheme.labelLarge),
            ],
          ),
          const SizedBox(height: 16),
          Text(org.description, style: textTheme.bodyLarge),
          const SizedBox(height: 24),
          SizedBox(
            height: 48,
            child: FilledButton.icon(
              // TODO 8: Disable the button (null) when isMember is true;
              //   otherwise call _join(context).
              onPressed: isMember ? null : () => _join(context),
              icon: Icon(isMember ? Icons.check : Icons.how_to_reg),
              label: Text(isMember ? 'Already a member' : 'Join ${org.acronym}'),
            ),
          ),
        ],
      ),
    );
  }
}
