// Run with: flutter test
// Each test names the TODOs it checks. A test passes once those TODOs work.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:unit6_org_fair/data/orgs.dart';
import 'package:unit6_org_fair/main.dart';
import 'package:unit6_org_fair/screens/about_screen.dart';
import 'package:unit6_org_fair/widgets/org_tile.dart';

OrgRepository repo() => OrgRepository(delay: const Duration(milliseconds: 100));

/// Opens the app on an 800 x 2400 screen so every form field fits.
Future<void> openApp(WidgetTester tester) async {
  tester.view.physicalSize = const Size(800, 2400);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);
  await tester.pumpWidget(OrgFairApp(repository: repo()));
  await tester.pump(const Duration(milliseconds: 200));
  await tester.pump();
}

Future<void> tapDestination(WidgetTester tester, String label) async {
  await tester.tap(find.descendant(
    of: find.byType(NavigationBar),
    matching: find.text(label),
  ));
  await tester.pumpAndSettle();
}

/// Joins Shuttle Smashers (SS) with the form from Part 1.
Future<void> joinShuttle(WidgetTester tester) async {
  await tester.tap(find.text('Shuttle Smashers'));
  await tester.pumpAndSettle();
  await tester.tap(find.text('Join SS'));
  await tester.pumpAndSettle();
  final fields = find.byType(TextFormField);
  await tester.enterText(fields.at(0), 'Juan Dela Cruz');
  await tester.enterText(fields.at(1), 'juan@wvsu.edu.ph');
  await tester.enterText(fields.at(2), '123456');
  await tester.tap(find.byType(DropdownButtonFormField<int>));
  await tester.pumpAndSettle();
  await tester.tap(find.text('Year 3').last);
  await tester.pumpAndSettle();
  await tester.tap(find.text('Media'));
  await tester.tap(find.byType(CheckboxListTile));
  await tester.pump();
  await tester.tap(find.widgetWithText(FilledButton, 'Submit'));
  await tester.pumpAndSettle();
}

void main() {
  testWidgets('Part 1 still works: loading, then the list', (tester) async {
    tester.view.physicalSize = const Size(800, 2400);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(OrgFairApp(repository: repo()));
    expect(find.text('Loading organizations...'), findsOneWidget);
    await tester.pump(const Duration(milliseconds: 200));
    await tester.pump();
    expect(find.text('Computer Science Circle'), findsOneWidget);
  });

  testWidgets('TODO 1 and 2: tabs switch, and the search survives',
      (tester) async {
    await openApp(tester);
    await tester.enterText(find.byType(TextField), 'pixel');
    await tester.pump();
    await tapDestination(tester, 'Schedule');
    expect(find.text('Booth schedule'), findsOneWidget,
        reason: 'TODO 2: tapping a destination must switch tabs');
    await tapDestination(tester, 'Orgs');
    expect(find.text('Pixel Arts Guild'), findsOneWidget);
    expect(find.text('Computer Science Circle'), findsNothing,
        reason: 'TODO 1: the search must survive a tab switch');
  });

  testWidgets('TODO 3, 4 and 5: a joined org shows in My Orgs with a badge',
      (tester) async {
    await openApp(tester);
    expect(find.byType(Badge), findsOneWidget, reason: 'TODO 3: add a Badge');
    expect(tester.widget<Badge>(find.byType(Badge)).isLabelVisible, isFalse,
        reason: 'TODO 3: hide the badge while count is 0');
    await joinShuttle(tester);
    expect(find.text('Joined'), findsOneWidget,
        reason: 'TODO 4 and 5: the list must show the new membership');
    expect(
      find.descendant(of: find.byType(Badge), matching: find.text('1')),
      findsOneWidget,
      reason: 'TODO 3: the badge shows the count',
    );
    await tapDestination(tester, 'My Orgs');
    expect(find.text('Shuttle Smashers'), findsOneWidget);
    expect(find.text('Media committee · 3 h/week'), findsOneWidget);
  });

  testWidgets('TODO 12 (needs 4 and 5): leaving an org asks first', (tester) async {
    await openApp(tester);
    await joinShuttle(tester);
    await tapDestination(tester, 'My Orgs');

    await tester.tap(find.byTooltip('Leave SS'));
    await tester.pumpAndSettle();
    expect(find.text('Leave SS?'), findsOneWidget);
    await tester.tap(find.text('Cancel'));
    await tester.pumpAndSettle();
    expect(find.text('Shuttle Smashers'), findsOneWidget,
        reason: 'Cancel must keep the membership');

    await tester.tap(find.byTooltip('Leave SS'));
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(FilledButton, 'Leave'));
    await tester.pumpAndSettle();
    expect(find.text("You haven't joined any org yet."), findsOneWidget);
    expect(find.text('You left SS'), findsOneWidget);
  });

  testWidgets('TODO 6: the drawer closes, then About opens', (tester) async {
    await openApp(tester);
    await tester.tap(find.byTooltip('Open navigation menu'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('About the fair'));
    await tester.pumpAndSettle();
    expect(find.byType(AboutScreen), findsOneWidget);
    await tester.pageBack();
    await tester.pumpAndSettle();
    expect(find.byType(Drawer), findsNothing,
        reason: 'The drawer must be closed when the user comes back');
  });

  testWidgets('TODO 7 and 8: category chips filter the list', (tester) async {
    await openApp(tester);
    await tester.tap(find.widgetWithText(FilterChip, 'Sports'));
    await tester.pump();
    expect(tester.widget<FilterChip>(find.widgetWithText(FilterChip, 'Sports'))
        .selected, isTrue, reason: 'TODO 7: the chip must turn on');
    expect(find.text('CICT Ballers'), findsOneWidget);
    expect(find.text('Shuttle Smashers'), findsOneWidget);
    expect(find.text('Computer Science Circle'), findsNothing,
        reason: 'TODO 8: only Sports orgs should be left');

    await tester.tap(find.widgetWithText(FilterChip, 'Arts'));
    await tester.pump();
    expect(find.text('Tunog CICT'), findsOneWidget);
    expect(find.text('CICT Ballers'), findsOneWidget);

    await tester.tap(find.widgetWithText(FilterChip, 'Sports'));
    await tester.tap(find.widgetWithText(FilterChip, 'Arts'));
    await tester.pump();
    expect(find.text('Computer Science Circle'), findsOneWidget,
        reason: 'No chip selected means show all');
  });

  testWidgets('TODO 9: the grid gets its columns from the width',
      (tester) async {
    await openApp(tester);
    await tester.tap(find.byTooltip('Show as grid'));
    await tester.pump();
    final grid = tester.widget<GridView>(find.byType(GridView));
    expect(grid.gridDelegate, isA<SliverGridDelegateWithMaxCrossAxisExtent>());
    // 800 wide - 16 padding = 784. 4 columns of at most 200,
    // with 3 gaps of 8: (784 - 24) / 4 = 190.
    expect(tester.getSize(find.byType(OrgTile).first).width,
        moreOrLessEquals(190));
  });

  testWidgets('TODO 10 and 11: the Officers tab', (tester) async {
    await openApp(tester);
    await tester.tap(find.text('Computer Science Circle'));
    await tester.pumpAndSettle();
    expect(find.widgetWithText(Tab, 'Officers'), findsOneWidget,
        reason: 'TODO 10: add the Officers tab');
    await tester.tap(find.widgetWithText(Tab, 'Officers'));
    await tester.pumpAndSettle();
    expect(find.text('Andrea Villanueva'), findsOneWidget);
    expect(find.text('Vice President'), findsOneWidget);
    expect(find.byType(Divider), findsNWidgets(2),
        reason: 'TODO 11: 3 officers, 2 dividers between them');
    await tester.tap(find.widgetWithText(Tab, 'Events'));
    await tester.pumpAndSettle();
    expect(find.text('Hour of Code'), findsOneWidget);
  });

  testWidgets('TODO 13 (needs 4 and 5): the schedule highlights joined orgs', (tester) async {
    await openApp(tester);
    await joinShuttle(tester);
    await tapDestination(tester, 'Schedule');
    final table = tester.widget<Table>(find.byType(Table));
    // Row 0 is the header. Shuttle Smashers (SS) is the 7th slot.
    expect(table.children.length, 9);
    expect(table.children[7].decoration, isNotNull,
        reason: 'Highlight the row of an org you joined');
    expect(table.children[1].decoration, isNull,
        reason: 'Leave the other rows plain');
  });
}
