import LandingLayout from "../layouts/LandingLayout";
function Contact() {
  return (
    <>
    <LandingLayout>
    <div className="contact-content">
      <h1>Helloo PInkiesss</h1>
      <p>
        "Whoever said orange was the new pink was seriously disturbed." 
      </p>
      <form className="contact-form">
        <label htmlFor="name">Name</label>
        <input type="text" id="name" name="name" />

        <label htmlFor="">Contact No:</label>
        <input type="contact" id="contact" name="contact" />

        <button type="submit">Send Message</button>
      </form>
    </div>
    </LandingLayout>
    </>
  );
}
export default Contact;