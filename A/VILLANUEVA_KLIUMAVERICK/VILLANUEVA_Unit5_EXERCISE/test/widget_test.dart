import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:villanueva_unit5_exercise/main.dart';

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
}
