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

3. Extra Page 6 analysis answers, if your document also requires them
E1 — main.dart: Why is OrgFairApp stateless but OrgListScreen stateful?
OrgFairApp only builds the app configuration: theme, routes, and the root HomeShell. It does not change its own data after construction. OrgListScreen owns changing UI state such as the search query, selected categories, favorite ids, hidden ids, grid/list mode, and the Future for orgs, so it must be stateful.

E2 — org_list_screen.dart, dispose(): Why dispose controllers?
TextEditingController registers listeners and holds resources. If it is not disposed when the State is removed, it can leak memory and keep callbacks alive. dispose() is the correct place to release it because it runs when the screen is permanently removed.

E3 — org_list_screen.dart, FutureBuilder: Order when pressing Try again?
_reload() calls setState and assigns a new fetchOrgs() future. FutureBuilder rebuilds with ConnectionState.waiting, so the loading message appears. When the future completes, the builder runs again with ConnectionState.done and shows either the list, the empty state, or the error state.

E4 — org_list_screen.dart, _buildOrgs: How does the list update while typing?
The TextField’s onChanged calls setState and stores the new _query. The build method runs again, _buildOrgs filters orgs using the new query, and the ListView/GridView rebuilds with only the matching orgs.

E5 — org_list_screen.dart, Expanded: “Constraints go down, sizes go up”?
The parent passes constraints down to children. Expanded tells the parent Flex to give the child the remaining space in the main axis. The child then chooses its own size within those constraints and reports that size back up. This is the Flutter layout rule: constraints go down, sizes go up.

E6 — org_card.dart: Where does the favorite star’s state live?
It lives in OrgListScreen’s _favoriteIds set. OrgCard is stateless; it receives isFavorite and an onLongPress callback. Tapping/long-pressing reports back to the parent, which updates the set with setState.

E7 — org_list_screen.dart, _openDetail: How does data come back?
Navigator.push returns a Future. _openDetail awaits that future. When JoinFormScreen calls Navigator.pop(registration), the awaited value becomes the Registration?. If it is not null, _openDetail wraps it in a Membership and sends it up through widget.onJoined.

E8 — org_banner.dart: Null safety and loading/error builders
bannerUrl is String?. The code copies it into url and checks if (url == null). After that check, Dart promotes url to String, so it can be passed to Image.network. loadingBuilder shows a spinner while the image loads, and errorBuilder shows a placeholder icon if the network image fails.

E9 — org_detail_screen.dart, _join: Why check context.mounted after await?
After await Navigator.push(...), the user may have navigated away and the widget may no longer be mounted. Using context after an await without checking can throw an error. context.mounted confirms the widget is still in the tree before calling Navigator.pop.

E10 — join_form_screen.dart, _formKey: What does GlobalKey<FormState> give you?
It gives access to the FormState of the Form. That lets the screen call validate(), save(), and reset() on all form fields at once. Without it, the submit button could not validate/save the entire form in one call.

E11 — join_form_screen.dart, autovalidateMode
AutovalidateMode.onUserInteraction means validation messages appear after the user has interacted with a field, not immediately when the form first appears. This avoids showing every error on an empty form at startup while still giving quick feedback as the user types.

A new Flutter project.
