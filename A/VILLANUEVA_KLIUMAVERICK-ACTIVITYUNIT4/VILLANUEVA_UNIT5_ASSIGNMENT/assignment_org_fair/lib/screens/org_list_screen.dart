import 'package:flutter/material.dart';

import '../data/orgs.dart';
import '../models/registration.dart';
import '../widgets/org_card.dart';
import '../widgets/state_message.dart';
import 'org_detail_screen.dart';

class OrgListScreen extends StatefulWidget {
  const OrgListScreen({super.key, required this.repository});

  final OrgRepository repository;

  @override
  State<OrgListScreen> createState() => _OrgListScreenState();
}

class _OrgListScreenState extends State<OrgListScreen> {
  late Future<List<Org>> _orgsFuture;
  final _searchController = TextEditingController();
  String _query = '';
  final Set<String> _hiddenIds = {};
  final Set<String> _favoriteIds = {};
  final Map<String, Registration> _registrations = {};

  @override
  void initState() {
    super.initState();
    // TODO 1: Start loading the orgs ONCE: store repository.fetchOrgs() in
    //   _orgsFuture.
    _orgsFuture = widget.repository.fetchOrgs();
  }

  // EXPLAIN E2: Why is _searchController disposed here? What would happen
  // over time if we forgot?
  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _reload() {
    // TODO 2: Fetch the orgs again inside setState() so the FutureBuilder
    //   rebuilds with the new Future. Use a block body { }, not =>.
    setState(() {
      _orgsFuture = widget.repository.fetchOrgs();
    });
  }

  void _setServerMode(ServerMode mode) {
    widget.repository.mode = mode;
    _reload();
  }

  void _toggleFavorite(Org org) {
    // TODO 3: Inside setState(), add org.id to _favoriteIds, or remove it if
    //   it is already there.
    setState(() {
      if (!_favoriteIds.add(org.id)) _favoriteIds.remove(org.id);
    });
  }

  void _hide(Org org) {
    setState(() => _hiddenIds.add(org.id));
    // The cascade operator (..) calls two methods on the same messenger.
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text('${org.acronym} hidden'),
          action: SnackBarAction(
            label: 'UNDO',
            onPressed: () => setState(() => _hiddenIds.remove(org.id)),
          ),
        ),
      );
  }

  // EXPLAIN E7: push() returns a Future. What value does it complete with,
  // and which line on the form screen sends that value back?
  Future<void> _openDetail(Org org) async {
    final registration = await Navigator.of(context).push<Registration>(
      MaterialPageRoute(
        builder: (_) => OrgDetailScreen(
          org: org,
          isMember: _registrations.containsKey(org.id),
        ),
      ),
    );
    if (registration != null) {
      setState(() => _registrations[org.id] = registration);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('CICT Org Fair'),
        actions: [
          // Lets you switch the fake server while the app runs, so you can
          // see every state of the screen.
          PopupMenuButton<ServerMode>(
            tooltip: 'Fake server mode',
            icon: const Icon(Icons.dns),
            onSelected: _setServerMode,
            itemBuilder: (_) => [
              for (final mode in ServerMode.values)
                CheckedPopupMenuItem(
                  value: mode,
                  checked: widget.repository.mode == mode,
                  child: Text('Server: ${mode.name}'),
                ),
            ],
          ),
        ],
      ),
      // EXPLAIN E3: This builder runs many times. List the states it can
      // be in, in order, when the server mode is "error" and the user
      // presses Try again.
      body: FutureBuilder<List<Org>>(
        future: _orgsFuture,
        builder: (context, snapshot) {
          // 1. Loading (done for you, use it as an example)
          if (snapshot.connectionState != ConnectionState.done) {
            return const StateMessage(
              icon: Icons.hourglass_top,
              text: 'Loading organizations...',
              showSpinner: true,
            );
          }
          // 2. Error
          // TODO 4: If snapshot.hasError, return a StateMessage with
          //   Icons.wifi_off, the error text (without "Exception: "), and a
          //   FilledButton.icon labelled "Try again" that calls _reload.
          if (snapshot.hasError) {
            return StateMessage(
              icon: Icons.wifi_off,
              text: snapshot.error.toString().replaceFirst('Exception: ', ''),
              action: FilledButton.icon(
                onPressed: _reload,
                icon: const Icon(Icons.refresh),
                label: const Text('Try again'),
              ),
            );
          }
          final orgs = snapshot.data ?? const <Org>[];
          // 3. Empty
          // TODO 5: If orgs is empty, return a StateMessage with Icons.inbox,
          //   the text "No organizations have signed up for the fair yet.", and
          //   an OutlinedButton "Refresh" that calls _reload.
          if (orgs.isEmpty) {
            return StateMessage(
              icon: Icons.inbox,
              text: 'No organizations have signed up for the fair yet.',
              action: OutlinedButton(
                onPressed: _reload,
                child: const Text('Refresh'),
              ),
            );
          }
          // 4. Success
          return _buildOrgs(orgs);
        },
      ),
    );
  }

  Widget _buildOrgs(List<Org> orgs) {
    // EXPLAIN E4: This filter has no loop that "watches" the search box.
    // So how does the list update while the user types?
    final q = _query.trim().toLowerCase();
    final visible = orgs
        .where((o) => !_hiddenIds.contains(o.id))
        .where((o) =>
            q.isEmpty ||
            o.name.toLowerCase().contains(q) ||
            o.acronym.toLowerCase().contains(q))
        .toList();

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(12),
          child: TextField(
            controller: _searchController,
            decoration: InputDecoration(
              prefixIcon: const Icon(Icons.search),
              labelText: 'Search organizations',
              border: const OutlineInputBorder(),
              suffixIcon: _query.isEmpty
                  ? null
                  : IconButton(
                      tooltip: 'Clear search',
                      icon: const Icon(Icons.clear),
                      onPressed: () {
                        _searchController.clear();
                        setState(() => _query = '');
                      },
                    ),
            ),
            // TODO 6: Save what the user typed into _query with setState().
            onChanged: (value) => setState(() => _query = value),
          ),
        ),
        // EXPLAIN E5: Remove this Expanded and run the app. What error do
        // you get? Explain it with "constraints go down, sizes go up".
        Expanded(
          child: visible.isEmpty
              ? const StateMessage(
                  icon: Icons.search_off,
                  text: 'No organizations match your search.',
                )
              : LayoutBuilder(
                  // Responsive: one column on phones, a grid when wider.
                  builder: (context, constraints) {
                    final columns = constraints.maxWidth < 600
                        ? 1
                        : (constraints.maxWidth < 1000 ? 2 : 3);
                    if (columns == 1) {
                      return ListView.builder(
                        itemCount: visible.length,
                        itemBuilder: (_, i) => _card(visible[i]),
                      );
                    }
                    return GridView.builder(
                      padding: const EdgeInsets.all(8),
                      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: columns,
                        mainAxisExtent: 96,
                      ),
                      itemCount: visible.length,
                      itemBuilder: (_, i) => _card(visible[i]),
                    );
                  },
                ),
        ),
      ],
    );
  }

  Widget _card(Org org) {
    final card = OrgCard(
      org: org,
      isFavorite: _favoriteIds.contains(org.id),
      isMember: _registrations.containsKey(org.id),
      onTap: () => _openDetail(org),
      onLongPress: () => _toggleFavorite(org),
    );
    // TODO 7: Wrap `card` in a Dismissible with key: ValueKey(org.id),
    //   onDismissed calling _hide(org), and a background (any colored Container
    //   with an icon).
    return Dismissible(
      key: ValueKey(org.id),
      onDismissed: (_) => _hide(org),
      background: Container(
        color: Theme.of(context).colorScheme.errorContainer,
        alignment: Alignment.centerLeft,
        padding: const EdgeInsets.only(left: 20),
        child: const Icon(Icons.archive_outlined),
      ),
      child: card,
    );
  }
}
