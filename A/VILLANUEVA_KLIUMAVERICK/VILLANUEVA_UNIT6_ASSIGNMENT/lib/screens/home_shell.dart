import 'package:flutter/material.dart';

import '../data/orgs.dart';
import '../models/membership.dart';
import 'my_orgs_screen.dart';
import 'org_list_screen.dart';
import 'schedule_screen.dart';

/// The app's frame: a NavigationBar with three destinations.
class HomeShell extends StatefulWidget {
  const HomeShell({super.key, required this.repository});

  final OrgRepository repository;

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  // EXPLAIN E1: In Part 1 the joined orgs were saved inside OrgListScreen.
  // Now they live here, in HomeShell. Which screens need this map, and why
  // can't one of those screens keep it for the others?
  final Map<String, Membership> _memberships = {};

    void _join(Membership membership) {
      // TODO 4: Save the membership in _memberships, keyed by the org's id.
      //   Use setState so every tab rebuilds with the new map.
      setState(() {
    _memberships[membership.org.id] = membership;
  });
}

  void _leave(Org org) {
    setState(() => _memberships.remove(org.id));
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      OrgListScreen(
        repository: widget.repository,
        memberships: _memberships,
        onJoined: _join,
      ),
      MyOrgsScreen(
        memberships: _memberships.values.toList(),
        onLeave: _leave,
        onBrowse: () => setState(() => _index = 0),
      ),
      ScheduleScreen(joinedIds: _memberships.keys.toSet()),
    ];
    final count = _memberships.length;

    return Scaffold(
      // EXPLAIN E2: Type something in the search box, open the Schedule tab,
      // then come back. Your search is still there. Which widget keeps it,
      // and how? (Experiment C1 shows what happens without it.)
      // TODO 1: Show only pages[_index], but keep every page alive.
      //   Replace pages[_index] with an IndexedStack.
      body: IndexedStack(
  index: _index,
  children: pages,
),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        // TODO 2: Switch to the destination the user tapped.
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: [
          const NavigationDestination(
            icon: Icon(Icons.storefront_outlined),
            selectedIcon: Icon(Icons.storefront),
            label: 'Orgs',
          ),
          NavigationDestination(
            // TODO 3: Wrap both icons in a Badge that shows how many orgs
            //   the student joined (count). Hide the badge when count is 0.
             icon: Badge(
              isLabelVisible: count > 0,
              label: Text('$count'),
              child: const Icon(Icons.badge_outlined),
            ),
            selectedIcon: Badge(
              isLabelVisible: count > 0,
              label: Text('$count'),
                child: const Icon(Icons.badge),
            ),
              label: 'My Orgs',
          ),
          const NavigationDestination(
            icon: Icon(Icons.calendar_month_outlined),
            selectedIcon: Icon(Icons.calendar_month),
            label: 'Schedule',
          ),
        ],
      ),
    );
  }
}
