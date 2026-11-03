import 'package:flutter/material.dart';

import '../data/fair_data.dart';
import '../data/orgs.dart';

/// The booth schedule on fair day, as a Table.
class ScheduleScreen extends StatelessWidget {
  const ScheduleScreen({super.key, required this.joinedIds});

  /// Ids of the orgs the student joined. Their rows are highlighted.
  final Set<String> joinedIds;

  String _orgName(String id) =>
      sampleOrgs.firstWhere((o) => o.id == id).acronym;

  TableRow _row(BuildContext context, ScheduleSlot slot) {
    final joined = joinedIds.contains(slot.orgId);
    return TableRow(
      // TODO 13: Highlight the rows of orgs the student joined: give them a
      //   BoxDecoration with colorScheme.primaryContainer. Other rows get
      //   no decoration (null).
      decoration: joined
    ? BoxDecoration(
        color: Theme.of(context).colorScheme.primaryContainer,
      )
    : null,
      children: [
        _cell(Text(slot.time)),
        _cell(Text(slot.booth)),
        _cell(Row(
          children: [
            Expanded(child: Text(_orgName(slot.orgId))),
            if (joined) const Icon(Icons.check_circle, size: 18),
          ],
        )),
      ],
    );
  }

  Widget _cell(Widget child) =>
      Padding(padding: const EdgeInsets.all(12), child: child);

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final header = Theme.of(context).textTheme.titleSmall;
    return Scaffold(
      appBar: AppBar(title: const Text('Booth schedule')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        // EXPLAIN E8: Why a Table here and not a Column of Rows? What would
        // go wrong with the columns if each Row sized itself?
        child: Table(
          border: TableBorder.all(color: colors.outlineVariant),
          columnWidths: const {
            0: FixedColumnWidth(96),
            1: FixedColumnWidth(72),
            2: FlexColumnWidth(),
          },
          children: [
            TableRow(
              decoration: BoxDecoration(color: colors.surfaceContainerHighest),
              children: [
                _cell(Text('Time', style: header)),
                _cell(Text('Booth', style: header)),
                _cell(Text('Org', style: header)),
              ],
            ),
            for (final slot in boothSchedule) _row(context, slot),
          ],
        ),
      ),
    );
  }
}
