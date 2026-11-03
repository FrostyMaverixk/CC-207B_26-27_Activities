# unit6_org_fair_Villanueva
E1 — home_shell.dart, _memberships
Question: Why do the joined orgs live in HomeShell?

The memberships are needed by three sibling screens: OrgListScreen marks joined orgs, MyOrgsScreen lists them, and ScheduleScreen highlights joined orgs. A single screen cannot own the map for the others because siblings cannot directly read each other’s state. HomeShell is the closest common parent, so lifting the state there lets it pass the same map down to all three tabs. This is “lifting state up.”

E2 — home_shell.dart, body
Question: Why does IndexedStack keep the search text?

IndexedStack keeps all of its children in the widget tree and only displays the selected one. That means OrgListScreen’s State and its TextEditingController are not destroyed when the user switches to Schedule and back. If the body were just pages[_index], the old page would be removed from the tree, its state would be disposed, and the search text would be lost. The IndexedStack keeps the page alive.

E3 — org_list_screen.dart, drawer onTap
Question: Why close the drawer before opening About?

The drawer is an overlay/route on top of the current screen. If we push the About screen while the drawer is still open, the drawer can remain underneath, and when the user comes back from About the drawer may still be open. Closing the drawer first returns the app to the normal screen, then pushes /about. This gives a clean navigation stack and matches the test’s expectation that the drawer is gone after pageBack.

E4 — org_list_screen.dart, category chips in Wrap
Question: Why use Wrap instead of Row?

Wrap moves its children to a new line when they do not fit horizontally. That is useful for filter chips because the number of categories and screen width can vary. A Row tries to place all chips on one line and will overflow if they do not fit, producing the yellow/black overflow warning. So Wrap makes the chip row responsive.

E5 — org_list_screen.dart, _buildGrid
Question: Column math for maxCrossAxisExtent: 200.

GridView subtracts padding first. On a 360-wide phone with 8 px padding on each side: 360 - 16 = 344 px of content. With maxCrossAxisExtent: 200 and 8 px spacing, the number of columns is roughly ceil((344 + 8) / (200 + 8)) = ceil(352 / 208) = 2. Each tile width is (344 - 8) / 2 = 168.

On a 1000-wide window: 1000 - 16 = 984; columns = ceil((984 + 8) / 208) = ceil(992 / 208) = 5; tile width = (984 - 4 * 8) / 5 = (984 - 32) / 5 = 190.4.

E6 — org_detail_screen.dart, DefaultTabController
Question: What must match in DefaultTabController, TabBar, and TabBarView?

The length of DefaultTabController, the number of Tab widgets in TabBar, and the number of children in TabBarView must all be equal. If they do not match, the tab controller can point to a tab that has no corresponding page, and Flutter throws an assertion/runtime error. In this assignment the correct number is 3: About, Officers, Events.

E7 — my_orgs_screen.dart, _confirmLeave
Question: Why is the dialog result bool? and why test == true?

showDialog<bool> returns Future<bool?>. The user can close the dialog by tapping Cancel, tapping Leave, tapping outside the dialog, or pressing the system back button. Cancel and explicit button taps can return false or true, but dismissing the dialog without choosing returns null. We test confirmed == true so only an explicit “Leave” action removes the org; null and false are both treated as “do not leave.”

E8 — schedule_screen.dart, Table
Question: Why use a Table instead of a Column of Rows?

A Table gives all rows shared column widths and shared borders. That keeps the Time, Booth, and Org columns aligned even when the text lengths differ. If we used a Column of separate Rows, each row would size its own cells independently, so the columns would not line up. The table also makes it easy to highlight a whole row with a TableRow.decoration.

