import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:villanueva_unit6_exercise/main.dart';

void main() {
  testWidgets('profile content fits a narrow screen and scrolls', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(320, 640);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(const MyApp());

    expect(find.text('Kliu Maverick Villanueva'), findsNWidgets(2));
    expect(
      tester
          .widget<MaterialApp>(find.byType(MaterialApp))
          .debugShowCheckedModeBanner,
      isFalse,
    );
    final profilePhoto = tester.widget<Image>(find.byType(Image));
    expect(
      (profilePhoto.image as AssetImage).assetName,
      'assets/images/Kliu Villanueva.jpg',
    );
    expect(find.text('My Biography'), findsOneWidget);
    expect(find.byType(SingleChildScrollView), findsOneWidget);
    await tester.ensureVisible(find.text('My Class Schedule'));
    await tester.pumpAndSettle();
    expect(find.text('Subject'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('pet tab shows the demo and double-tap toggles its heart', (
    tester,
  ) async {
    await tester.pumpWidget(const MyApp());
    await tester.tap(find.text('My Pet'));
    await tester.pumpAndSettle();

    expect(find.text('Meet Squonk'), findsOneWidget);
    expect(find.textContaining('bubbly croak'), findsOneWidget);
    expect(find.text('Squonk has called 0 times.'), findsOneWidget);
    final petPhoto = tester.widget<Image>(find.byKey(const Key('pet-photo')));
    expect(
      (petPhoto.image as AssetImage).assetName,
      'assets/images/Squonk.jpeg',
    );

    final photo = find.byKey(const Key('pet-photo'));
    await tester.tap(photo);
    await tester.pump(const Duration(milliseconds: 100));
    await tester.tap(photo);
    await tester.pumpAndSettle();
    expect(
      tester.widget<AnimatedOpacity>(find.byType(AnimatedOpacity)).opacity,
      1,
    );

    await tester.tap(photo);
    await tester.pump(const Duration(milliseconds: 100));
    await tester.tap(photo);
    await tester.pumpAndSettle();
    expect(
      tester.widget<AnimatedOpacity>(find.byType(AnimatedOpacity)).opacity,
      0,
    );
    expect(tester.takeException(), isNull);
  });

  testWidgets(
    'pet count persists across tabs and resets only on confirmation',
    (tester) async {
      await tester.pumpWidget(const MyApp());
      await tester.tap(find.text('My Pet'));
      await tester.pumpAndSettle();
      await tester.ensureVisible(find.text('Hear Squonk'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Hear Squonk'));
      await tester.pump();
      expect(find.text('Squonk has called 1 time.'), findsOneWidget);

      await tester.tap(find.text('Profile'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('My Pet'));
      await tester.pumpAndSettle();
      expect(find.text('Squonk has called 1 time.'), findsOneWidget);

      await tester.tap(find.text('Reset count'));
      await tester.pumpAndSettle();
      expect(find.text('Reset bark count?'), findsOneWidget);
      await tester.tap(find.text('Cancel'));
      await tester.pumpAndSettle();
      expect(find.text('Squonk has called 1 time.'), findsOneWidget);

      await tester.tap(find.text('Reset count'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Reset'));
      await tester.pumpAndSettle();
      expect(find.text('Squonk has called 0 times.'), findsOneWidget);
      final resetButton = tester.widget<OutlinedButton>(
        find.ancestor(
          of: find.text('Reset count'),
          matching: find.byType(OutlinedButton),
        ),
      );
      expect(resetButton.onPressed, isNull);
      expect(tester.takeException(), isNull);
    },
  );

  testWidgets('gallery loads all bundled photos', (tester) async {
    await tester.pumpWidget(const MyApp());
    await tester.tap(find.text('Gallery'));
    await tester.pumpAndSettle();

    final galleryAssets = tester
        .widgetList<Image>(find.byType(Image))
        .map((image) => (image.image as AssetImage).assetName)
        .where((asset) => asset.startsWith('assets/images/gallery/'))
        .toSet();

    expect(galleryAssets, {
      'assets/images/gallery/1.jpg',
      'assets/images/gallery/2.jpg',
      'assets/images/gallery/3.jpg',
      'assets/images/gallery/4.jpg',
      'assets/images/gallery/5.jpg',
      'assets/images/gallery/6.webp',
    });
    expect(tester.takeException(), isNull);

    final galleryTiles = find.descendant(
      of: find.byType(GridView),
      matching: find.byType(GestureDetector),
    );
    await tester.tap(galleryTiles.at(0));
    await tester.pumpAndSettle();
    expect(find.text('City park'), findsOneWidget);
    await tester.tap(find.text('Make favorite'));
    await tester.pumpAndSettle();
    expect(find.byIcon(Icons.star), findsOneWidget);

    await tester.tap(galleryTiles.at(1));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Make favorite'));
    await tester.pumpAndSettle();
    expect(find.byIcon(Icons.star), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
