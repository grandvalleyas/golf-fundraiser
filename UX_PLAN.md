# UX Improvements Plan

## High Impact

### 1. Navbar: Admin link for admin users
Admins have no way to reach `/{sport}/admin` without typing the URL. Show an "Admin" nav link when `user.publicMetadata.role === "admin"`.

### 2. Register: Show event context on form
Create/edit mode title just says "Register". Should show event name + date so users know which outing they're signing up for.

### 3. Register: Hide cancel button in create mode with no existing registration
Clicking Cancel with no registration goes to "No reservation found" dead end. Only show Cancel in edit mode or when a registration exists.

### 4. Sponsor: Loading skeleton
Page shows nothing while fetching sponsor data — brief flash of empty content. Add a skeleton or spinner.

### 5. Homepage: Signed-out CTA
Homepage has no auth prompt for signed-out users. Add a "Sign up to register" button below the sport cards.

## Medium Impact

### 6. Register view: Show amount paid
View mode doesn't display how much was paid. Add amount to the reservation card.

### 7. Admin: Link back to event page
Admin dashboard has no navigation to the public-facing sport page. Add a link in the header.

### 8. Sport page: Show contact info
`contactEmail` and `contactPhone` exist in config but aren't displayed. Add a contact section to the sport landing page.

### 9. Gallery lightbox: Prev/next navigation
Currently can only close and reopen images. Add arrow navigation between images in the lightbox.

### 10. Footer: Dynamic contact email
Footer hardcodes `schmidtk@gvsu.edu`. Should be contextual — show the sport's contact email when on a sport page.
