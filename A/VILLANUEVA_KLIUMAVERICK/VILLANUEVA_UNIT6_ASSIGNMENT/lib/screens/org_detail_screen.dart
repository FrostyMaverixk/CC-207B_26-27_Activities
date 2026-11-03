import 'package:flutter/material.dart';

import '../data/fair_data.dart';
import '../data/orgs.dart';
import '../models/registration.dart';
import '../widgets/org_banner.dart';
import 'join_form_screen.dart';

/// Shows one org in three tabs. Stateless: everything it needs comes in
/// from the parent.
class OrgDetailScreen extends StatelessWidget {
  const OrgDetailScreen({super.key, required this.org, required this.isMember});

  final Org org;
  final bool isMember;

  Future<void> _join(BuildContext context) async {
    final registration = await Navigator.of(context).push<Registration>(
      MaterialPageRoute(builder: (_) => JoinFormScreen(org: org)),
    );
    if (registration != null && context.mounted) {
      // Pass the registration on to the list screen.
      Navigator.of(context).pop(registration);
    }
  }

  @override
  Widget build(BuildContext context) {
    // EXPLAIN E6: DefaultTabController has a length, the TabBar has tabs and
    // the TabBarView has children. What must be true about these three
    // numbers? What happens when they don't match? (Experiment C3)
    return DefaultTabController(
      // TODO 10: Add the Officers tab between About and Events: a Tab in
      //   the TabBar, _buildOfficers() in the TabBarView, and the right
      //   length.
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: Text(org.acronym),
          bottom: const TabBar(
            tabs: [
              Tab(icon: Icon(Icons.info_outline), text: 'About'),
              Tab(icon: Icon(Icons.people_outline), text: 'Officers'),
              Tab(icon: Icon(Icons.event_outlined), text: 'Events'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
             _buildAbout(context),
              _buildOfficers(),
              _buildEvents(),
          ],
        ),
      ),
    );
  }

  Widget _buildAbout(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final colors = Theme.of(context).colorScheme;
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: AspectRatio(aspectRatio: 2, child: OrgBanner(org: org)),
        ),
        const SizedBox(height: 16),
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
            onPressed: isMember ? null : () => _join(context),
            icon: Icon(isMember ? Icons.check : Icons.how_to_reg),
            label: Text(isMember ? 'Already a member' : 'Join ${org.acronym}'),
          ),
        ),
      ],
    );
  }

  Widget _buildOfficers() {
  final officers = officersByOrg[org.id] ?? const <Officer>[];

  if (officers.isEmpty) {
    return const Center(child: Text('No officers listed.'));
  }

  return ListView.separated(
    itemCount: officers.length,
    separatorBuilder: (context, index) => const Divider(height: 1),
    itemBuilder: (context, index) {
      final officer = officers[index];
      return ListTile(
        leading: CircleAvatar(
          child: Text(officer.name.characters.first),
        ),
        title: Text(officer.name),
        subtitle: Text(officer.role),
      );
    },
  );
}
  Widget _buildEvents() {
    final events = eventsByOrg[org.id] ?? const <FairEvent>[];
    if (events.isEmpty) {
      return const Center(child: Text('No events yet.'));
    }
    return ListView(
      children: [
        for (final event in events)
          ListTile(
            leading: const Icon(Icons.event),
            title: Text(event.title),
            subtitle: Text('${event.when} · ${event.place}'),
          ),
      ],
    );
  }
}
