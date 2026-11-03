import 'dart:async';

import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Kliu Maverick Villanueva',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(colorSchemeSeed: Colors.indigo, useMaterial3: true),
      home: const HomeShell(),
    );
  }
}

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _selectedIndex = 0;

  static const _screens = [ProfileScreen(), PetScreen(), GalleryScreen()];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _selectedIndex, children: _screens),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (index) {
          setState(() => _selectedIndex = index);
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person),
            label: 'Profile',
          ),
          NavigationDestination(
            icon: Icon(Icons.pets_outlined),
            selectedIcon: Icon(Icons.pets),
            label: 'My Pet',
          ),
          NavigationDestination(
            icon: Icon(Icons.photo_library_outlined),
            selectedIcon: Icon(Icons.photo_library),
            label: 'Gallery',
          ),
        ],
      ),
    );
  }
}

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  static const _name = 'Kliu Maverick Villanueva';
  static const _infos = [
    ProfileInfo(icon: Icons.school_outlined, label: 'Course', value: 'CC-207B'),
    ProfileInfo(icon: Icons.code, label: 'Learning', value: 'Flutter and Dart'),
    ProfileInfo(
      icon: Icons.lightbulb_outline,
      label: 'Strength',
      value: 'Curiosity and creativity',
    ),
    ProfileInfo(
      icon: Icons.flag_outlined,
      label: 'Goal',
      value: 'Build useful applications',
    ),
  ];
  static const _hobbies = [
    'Chess',
    'Coding',
    'Reading',
    'Design',
    'Learning',
    'Travel',
  ];
  static const _schedule = [
    ClassSlot(day: 'Mon', time: '08:00', subject: 'Web Development'),
    ClassSlot(day: 'Tue', time: '09:30', subject: 'Application Development'),
    ClassSlot(day: 'Wed', time: '10:30', subject: 'Data Structures'),
    ClassSlot(day: 'Thu', time: '01:00', subject: 'Systems Analysis'),
  ];

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text(_name)),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 760),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      ClipOval(
                        child: Image.asset(
                          'assets/images/Kliu Villanueva.jpg',
                          width: 104,
                          height: 104,
                          fit: BoxFit.cover,
                          semanticLabel: 'Photo of $_name',
                        ),
                      ),
                      const SizedBox(width: 20),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(_name, style: theme.textTheme.headlineSmall),
                            Text(
                              'Student | Curious creator | Lifelong learner',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: theme.textTheme.bodyMedium?.copyWith(
                                color: theme.colorScheme.onSurfaceVariant,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'These starter details are examples; edit them to make '
                    'the profile your own.',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text('A little about me', style: theme.textTheme.titleLarge),
                  const SizedBox(height: 8),
                  ...[for (final info in _infos) InfoTile(info: info)],
                  const SizedBox(height: 16),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'My Biography',
                            style: theme.textTheme.titleLarge,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'I am a student who enjoys exploring how technology '
                            'can turn creative ideas into useful tools. I like '
                            'learning by building projects, and I am currently '
                            'practicing Flutter and Dart while balancing my '
                            'interests in chess and coding.',
                            style: theme.textTheme.bodyMedium,
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('My Hobbies', style: theme.textTheme.titleLarge),
                          const SizedBox(height: 12),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: [
                              for (final hobby in _hobbies)
                                Chip(label: Text(hobby)),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'My Class Schedule',
                            style: theme.textTheme.titleLarge,
                          ),
                          const SizedBox(height: 12),
                          Table(
                            columnWidths: const {
                              0: FixedColumnWidth(70),
                              1: FixedColumnWidth(90),
                              2: FlexColumnWidth(),
                            },
                            border: TableBorder.all(
                              color: theme.colorScheme.outline,
                            ),
                            children: [
                              TableRow(
                                decoration: BoxDecoration(
                                  color: theme.colorScheme.primaryContainer,
                                ),
                                children: const [
                                  Padding(
                                    padding: EdgeInsets.all(8),
                                    child: Text(
                                      'Day',
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                  Padding(
                                    padding: EdgeInsets.all(8),
                                    child: Text(
                                      'Time',
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                  Padding(
                                    padding: EdgeInsets.all(8),
                                    child: Text(
                                      'Subject',
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              for (final slot in _schedule)
                                TableRow(
                                  children: [
                                    Padding(
                                      padding: const EdgeInsets.all(8),
                                      child: Text(slot.day),
                                    ),
                                    Padding(
                                      padding: const EdgeInsets.all(8),
                                      child: Text(slot.time),
                                    ),
                                    Padding(
                                      padding: const EdgeInsets.all(8),
                                      child: Text(slot.subject),
                                    ),
                                  ],
                                ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class ProfileInfo {
  const ProfileInfo({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;
}

class ClassSlot {
  const ClassSlot({
    required this.day,
    required this.time,
    required this.subject,
  });

  final String day;
  final String time;
  final String subject;
}

class InfoTile extends StatelessWidget {
  const InfoTile({super.key, required this.info});

  final ProfileInfo info;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Icon(info.icon, color: theme.colorScheme.primary),
      title: Text(info.label, style: theme.textTheme.titleSmall),
      subtitle: Text(info.value, style: theme.textTheme.bodyMedium),
    );
  }
}

class Photo {
  const Photo({required this.asset, required this.caption});

  final String asset;
  final String caption;
}

class GalleryScreen extends StatefulWidget {
  const GalleryScreen({super.key});

  @override
  State<GalleryScreen> createState() => _GalleryScreenState();
}

class _GalleryScreenState extends State<GalleryScreen> {
  static const List<Photo> _photos = [
    Photo(asset: 'assets/images/gallery/1.jpg', caption: 'City park'),
    Photo(
      asset: 'assets/images/gallery/2.jpg',
      caption: 'Butterflies in a meadow',
    ),
    Photo(asset: 'assets/images/gallery/3.jpg', caption: 'Citrus splash'),
    Photo(asset: 'assets/images/gallery/4.jpg', caption: 'Fish underwater'),
    Photo(
      asset: 'assets/images/gallery/5.jpg',
      caption: 'Butterflies in glass',
    ),
    Photo(asset: 'assets/images/gallery/6.webp', caption: 'Forest reflection'),
  ];
  String? _favoriteAsset;

  Future<void> _open(Photo photo) async {
    final bool? makeFavorite = await Navigator.push<bool>(
      context,
      MaterialPageRoute(builder: (_) => PhotoScreen(photo: photo)),
    );

    if (!mounted) return;
    if (makeFavorite == true) {
      setState(() {
        _favoriteAsset = photo.asset;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Gallery')),
      body: GridView.extent(
        maxCrossAxisExtent: 160,
        padding: const EdgeInsets.all(8),
        mainAxisSpacing: 8,
        crossAxisSpacing: 8,
        children: [
          for (final photo in _photos)
            GestureDetector(
              onTap: () => _open(photo),
              child: Stack(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Image.asset(
                      photo.asset,
                      fit: BoxFit.cover,
                      semanticLabel: photo.caption,
                    ),
                  ),
                  if (_favoriteAsset == photo.asset)
                    Positioned(
                      top: 8,
                      right: 8,
                      child: Container(
                        padding: const EdgeInsets.all(6),
                        decoration: const BoxDecoration(
                          color: Colors.amber,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.star,
                          color: Colors.white,
                          size: 18,
                        ),
                      ),
                    ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class PhotoScreen extends StatelessWidget {
  const PhotoScreen({super.key, required this.photo});

  final Photo photo;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(photo.caption)),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Expanded(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(24),
                    child: Image.asset(
                      photo.asset,
                      fit: BoxFit.contain,
                      semanticLabel: photo.caption,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                FilledButton.icon(
                  onPressed: () => Navigator.pop(context, true),
                  icon: const Icon(Icons.star_border),
                  label: const Text('Make favorite'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class PetScreen extends StatefulWidget {
  const PetScreen({super.key});

  @override
  State<PetScreen> createState() => _PetScreenState();
}

class _PetScreenState extends State<PetScreen> {
  final AudioPlayer _player = AudioPlayer();
  late final StreamSubscription<void> _completionSubscription;
  bool _isPlaying = false;
  bool _showHeart = false;
  int _callCount = 0;

  @override
  void initState() {
    super.initState();
    _completionSubscription = _player.onPlayerComplete.listen((_) {
      if (mounted) setState(() => _isPlaying = false);
    });
  }

  @override
  void dispose() {
    unawaited(_completionSubscription.cancel());
    unawaited(_player.dispose());
    super.dispose();
  }

  Future<void> _playSound() async {
    setState(() {
      _isPlaying = true;
      _callCount++;
    });

    try {
      await _player.play(AssetSource('sounds/pet_sound.wav'));
    } catch (error) {
      if (!mounted) return;
      setState(() => _isPlaying = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('The demo sound could not be played.')),
      );
      debugPrint('Could not play the pet sound: $error');
    }
  }

  Future<void> _resetCount() async {
    final bool? confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Reset bark count?'),
        content: const Text('This will clear the current bark count.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Reset'),
          ),
        ],
      ),
    );

    if (!mounted || confirmed != true) return;
    setState(() => _callCount = 0);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final countLabel = _callCount == 1 ? 'time' : 'times';

    return Scaffold(
      appBar: AppBar(title: const Text('My Pet')),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 760),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('Meet Squonk', style: theme.textTheme.headlineSmall),
                  const SizedBox(height: 8),
                  Text(
                    'Squonk is a curious, shy creature with a bubbly croak '
                    'and a little squeaky finish.',
                    style: theme.textTheme.bodyMedium,
                  ),
                  const SizedBox(height: 20),
                  GestureDetector(
                    onDoubleTap: () {
                      setState(() => _showHeart = !_showHeart);
                    },
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(24),
                      child: AspectRatio(
                        aspectRatio: 4 / 3,
                        child: Stack(
                          fit: StackFit.expand,
                          children: [
                            Image.asset(
                              'assets/images/Squonk.jpeg',
                              key: const Key('pet-photo'),
                              fit: BoxFit.cover,
                              semanticLabel: 'Photo of Squonk',
                            ),
                            IgnorePointer(
                              child: AnimatedOpacity(
                                opacity: _showHeart ? 1 : 0,
                                duration: const Duration(milliseconds: 200),
                                child: Center(
                                  child: Icon(
                                    Icons.favorite,
                                    color: theme.colorScheme.error,
                                    size: 64,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Center(
                    child: Text(
                      'Squonk has called $_callCount $countLabel.',
                      style: theme.textTheme.titleMedium,
                      textAlign: TextAlign.center,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Center(
                    child: FilledButton.icon(
                      onPressed: _isPlaying ? null : _playSound,
                      icon: Icon(
                        _isPlaying ? Icons.graphic_eq : Icons.volume_up,
                      ),
                      label: Text(_isPlaying ? 'Playing...' : 'Hear Squonk'),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Center(
                    child: OutlinedButton(
                      onPressed: _callCount == 0 ? null : _resetCount,
                      child: const Text('Reset count'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
