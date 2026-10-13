import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../data/orgs.dart';
import '../models/registration.dart';

class JoinFormScreen extends StatefulWidget {
  const JoinFormScreen({super.key, required this.org});

  final Org org;

  @override
  State<JoinFormScreen> createState() => _JoinFormScreenState();
}

class _JoinFormScreenState extends State<JoinFormScreen> {
  // EXPLAIN E10: What is a GlobalKey<FormState>, and which three methods
  // does it let us call on the form?
  final _formKey = GlobalKey<FormState>();

  // Filled in by each field's onSaved when the form is saved.
  String _fullName = '';
  String _email = '';
  String _studentId = '';
  int? _yearLevel;

  // Inputs outside the TextFormFields: the State owns their values and
  // the widgets only show them (the input loop from the slides).
  Committee _committee = Committee.events;
  double _hours = 3;
  bool _wantsUpdates = true;
  bool _agreed = false;

  static final _emailPattern = RegExp(r'^[\w.+-]+@wvsu\.edu\.ph$');

  void _submit() {
    // TODO 9: Validate the form and stop (return) if it is not valid. Then
    //   save it so every onSaved runs.
    final form = _formKey.currentState!;
    if (!form.validate()) return;
    form.save();
    final registration = Registration(
      fullName: _fullName,
      email: _email,
      studentId: _studentId,
      yearLevel: _yearLevel ?? 1,
      committee: _committee,
      hoursPerWeek: _hours.round(),
      wantsUpdates: _wantsUpdates,
    );
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          'Welcome to ${widget.org.acronym}, ${registration.fullName}!',
        ),
      ),
    );
    // TODO 10: Close this screen and send `registration` back to the screen
    //   that opened it.
    Navigator.of(context).pop(registration);
  }

  void _reset() {
    _formKey.currentState!.reset();
    setState(() {
      _committee = Committee.events;
      _hours = 3;
      _wantsUpdates = true;
      _agreed = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return Scaffold(
      appBar: AppBar(title: Text('Join ${widget.org.acronym}')),
      body: Form(
        key: _formKey,
        // EXPLAIN E11: Why onUserInteraction instead of always? (Try both.)
        autovalidateMode: AutovalidateMode.onUserInteraction,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              decoration: const InputDecoration(
                labelText: 'Full name',
                prefixIcon: Icon(Icons.person),
                border: OutlineInputBorder(),
              ),
              textCapitalization: TextCapitalization.words,
              // A validator returns an error message, or null when valid.
              validator: (value) => (value == null || value.trim().isEmpty)
                  ? 'Enter your full name'
                  : null,
              onSaved: (value) => _fullName = value!.trim(),
            ),
            const SizedBox(height: 16),
            TextFormField(
              decoration: const InputDecoration(
                labelText: 'WVSU email',
                hintText: 'juan.delacruz@wvsu.edu.ph',
                prefixIcon: Icon(Icons.email),
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.emailAddress,
              validator: (value) {
                // TODO 11: Return 'Enter your WVSU email' when empty, 'Use
                //   your school email, like juan@wvsu.edu.ph' when it does not
                //   match _emailPattern, and null when valid.
                if (value == null || value.trim().isEmpty) {
                  return 'Enter your WVSU email';
                }
                if (!_emailPattern.hasMatch(value.trim())) {
                  return 'Use your school email, like juan@wvsu.edu.ph';
                }
                return null;
              },
              onSaved: (value) => _email = value!.trim(),
            ),
            const SizedBox(height: 16),
            TextFormField(
              decoration: const InputDecoration(
                labelText: 'Student ID number',
                prefixIcon: Icon(Icons.badge),
                border: OutlineInputBorder(),
                helperText: 'Numbers only',
              ),
              keyboardType: TextInputType.number,
              maxLength: 10,
              // TODO 12: Allow digits only with
              //   FilteringTextInputFormatter.digitsOnly, and return 'Enter at
              //   least 6 digits' when the value is shorter than 6.
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              validator: (value) => (value == null || value.length < 6)
                  ? 'Enter at least 6 digits'
                  : null,
              onSaved: (value) => _studentId = value!,
            ),
            const SizedBox(height: 8),
            DropdownButtonFormField<int>(
              initialValue: _yearLevel,
              decoration: const InputDecoration(
                labelText: 'Year level',
                prefixIcon: Icon(Icons.school),
                border: OutlineInputBorder(),
              ),
              items: [
                for (var y = 1; y <= 4; y++)
                  DropdownMenuItem(value: y, child: Text('Year $y')),
              ],
              onChanged: (value) => setState(() => _yearLevel = value),
              validator: (value) =>
                  value == null ? 'Choose your year level' : null,
            ),
            const SizedBox(height: 24),
            Text('Preferred committee', style: textTheme.titleMedium),
            RadioGroup<Committee>(
              groupValue: _committee,
              onChanged: (value) => setState(() => _committee = value!),
              child: Column(
                children: [
                  for (final c in Committee.values)
                    RadioListTile<Committee>(value: c, title: Text(c.label)),
                ],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Hours per week you can help: ${_hours.round()}',
              style: textTheme.titleMedium,
            ),
            // TODO 13: Make these three inputs work. Each onChanged must store
            //   the new value in the State with setState() (the Slider in
            //   _hours, the Switch in _wantsUpdates, the Checkbox in _agreed;
            //   the checkbox value is bool?, so use ?? false).
            Slider(
              value: _hours,
              min: 1,
              max: 10,
              divisions: 9,
              label: '${_hours.round()} h',
              onChanged: (value) => setState(() => _hours = value),
            ),
            SwitchListTile(
              title: const Text('Send me event updates'),
              value: _wantsUpdates,
              onChanged: (value) => setState(() => _wantsUpdates = value),
            ),
            CheckboxListTile(
              title: const Text('I agree to follow the org constitution'),
              value: _agreed,
              onChanged: (value) => setState(() => _agreed = value ?? false),
              controlAffinity: ListTileControlAffinity.leading,
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: _reset,
                    child: const Text('Reset'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: FilledButton(
                    // TODO 14: Keep Submit disabled (null) until _agreed is
                    //   true; then call _submit.
                    onPressed: _agreed ? _submit : null,
                    child: const Text('Submit'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
