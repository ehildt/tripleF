# Style Verification

**Required after creating or modifying styles.** Review the actual rendered and computed behavior rather than treating a successful build as proof of correct styling.

## Static checks

- Run `grep "@apply"` on each modified file and confirm zero matches.
- Run `grep "@reference"` on each modified file and confirm zero matches.
- Confirm every `var()` reference points to an existing semantic token.
- Check that no duplicate spacing token, unused new token, hardcoded themed value, or styling-only wrapper was introduced.
- Review selector specificity so scoped rules apply at the intended level without new specificity regressions.

## Existing quality coverage

Run existing tests that cover the touched component and report failures. Stories that already exist should render correctly; creating or updating tests, stories, or using browser automation requires explicit user consent.

Storybook visual states are documentation and do not replace behavioral tests. Do not create missing coverage speculatively during styling work.

## Visual and computed verification

When the required rendered checks are available and authorized:

- Toggle palettes and confirm semantic colors update correctly.
- Toggle light and dark display modes and confirm overrides and contrast remain correct.
- Inspect computed styles in browser developer tools and confirm every `var()` reference resolves.
- Inspect hover and other state rules and confirm intended `color-mix()` values are produced.
- Exercise floating surfaces and confirm the invisible backdrop sits below the panel and outside-click behavior remains intact.
- Check layout for wrapper removal, internal chrome ownership, outer spacing, overflow, and specificity regressions.

If browser automation is not approved, ask the user to perform the rendered checks manually rather than using it implicitly.

## Completion checklist

- Prohibited-directive searches are empty.
- Existing relevant tests pass and existing stories render where available.
- Palette and display-mode behavior is preserved.
- Computed token and state values resolve as intended.
- Specificity, stacking, overflow, and spacing ownership show no regression.
- Any unverified rendered behavior is reported explicitly rather than claimed as tested.
