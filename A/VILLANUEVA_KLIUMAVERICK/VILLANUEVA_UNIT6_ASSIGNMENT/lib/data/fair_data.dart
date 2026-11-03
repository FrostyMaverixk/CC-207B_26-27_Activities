// STARTER FILE: given to students as-is. More data for Part 2.

class Officer {
  const Officer(this.name, this.role);

  final String name;
  final String role;
}

class FairEvent {
  const FairEvent(this.title, this.when, this.place);

  final String title;
  final String when;
  final String place;
}

/// One booth slot on fair day: which org is at which booth, and when.
class ScheduleSlot {
  const ScheduleSlot(this.time, this.booth, this.orgId);

  final String time;
  final String booth;
  final String orgId;
}

/// Officers of each org, by org id.
const Map<String, List<Officer>> officersByOrg = {
  'csc': [
    Officer('Andrea Villanueva', 'President'),
    Officer('Mark Gonzales', 'Vice President'),
    Officer('Lea Panes', 'Secretary'),
  ],
  'itso': [
    Officer('Paolo Reyes', 'President'),
    Officer('Kim Salazar', 'Treasurer'),
  ],
  'robotics': [
    Officer('Gian Tolentino', 'Captain'),
    Officer('Ria Sumagaysay', 'Lead Builder'),
  ],
  'ballers': [
    Officer('Jose Ledesma', 'Team Captain'),
    Officer('Carlo Tan', 'Manager'),
  ],
  'shuttle': [
    Officer('Bea Javellana', 'President'),
    Officer('Nico Lim', 'Coach'),
  ],
  'pixel': [
    Officer('Ysa Montinola', 'President'),
    Officer('Dan Espinosa', 'Creative Director'),
    Officer('Mia Gerochi', 'Photo Lead'),
  ],
  'tunog': [
    Officer('Rafa Delgado', 'Band Leader'),
    Officer('Joy Araneta', 'Choir Director'),
  ],
  'tabang': [
    Officer('Ana Locsin', 'Coordinator'),
    Officer('Ben Siason', 'Volunteer Lead'),
  ],
};

/// Upcoming events of each org, by org id.
const Map<String, List<FairEvent>> eventsByOrg = {
  'csc': [
    FairEvent('Hour of Code', 'Nov 8, 1:00 PM', 'CICT Lab 2'),
    FairEvent('Algorithms Study Jam', 'Nov 15, 3:00 PM', 'Library'),
  ],
  'itso': [FairEvent('Flutter Workshop', 'Nov 12, 9:00 AM', 'CICT AVR')],
  'robotics': [FairEvent('Line Follower Build', 'Nov 20, 1:00 PM', 'Lab 4')],
  'ballers': [FairEvent('Tryouts', 'Nov 6, 4:00 PM', 'WVSU Gym')],
  'shuttle': [FairEvent('Beginners Saturday', 'Nov 9, 8:00 AM', 'WVSU Gym')],
  'pixel': [
    FairEvent('Photo Walk', 'Nov 10, 6:00 AM', 'Calle Real'),
    FairEvent('UI Design Clinic', 'Nov 17, 2:00 PM', 'CICT Lab 1'),
  ],
  'tunog': [FairEvent('Open Jam', 'Nov 14, 5:00 PM', 'Quadrangle')],
  'tabang': [FairEvent('Barangay Tech Day', 'Nov 23, 8:00 AM', 'Brgy. Tabuc Suba')],
};

/// The booth schedule on fair day.
const List<ScheduleSlot> boothSchedule = [
  ScheduleSlot('8:00 AM', 'A1', 'csc'),
  ScheduleSlot('8:00 AM', 'A2', 'ballers'),
  ScheduleSlot('9:00 AM', 'A1', 'itso'),
  ScheduleSlot('9:00 AM', 'A2', 'pixel'),
  ScheduleSlot('10:00 AM', 'B1', 'robotics'),
  ScheduleSlot('10:00 AM', 'B2', 'tunog'),
  ScheduleSlot('1:00 PM', 'B1', 'shuttle'),
  ScheduleSlot('1:00 PM', 'B2', 'tabang'),
];
