import React, { useState } from "react";
import CodeBlock from "@/components/CodeBlock";
import { Terminal, Notebook } from "lucide-react";
import { sendEmail } from "@/lib/email"; // adjust the import path as needed

const UploadingQubots = () => {
  // State for form fields: GitHub username (used as name), user's email, and reason for joining
  const [githubUsername, setGithubUsername] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Prepare the email data for EmailJS
    const emailData = {
      name: githubUsername, // Use GitHub username as the sender's name
      email: userEmail,     // User's email address
      message: reason,      // Reason for joining
      subject: "New GitHub Sign In Request",
    };

    // Send email using the provided sendEmail function
    const result = await sendEmail(emailData);
    if (!result.success) {
      console.error("Error sending email:", result.message);
      setError(result.message);
    } else {
      setSubmitted(true);
    }
  };

  return (
    <div className="prose max-w-none">
      <div className="space-y-8">
        {/* Step 1 */}
        <div className="bg-primary-50 p-6 rounded-xl border border-primary-100 shadow-sm">
  <h2 className="text-xl font-semibold mb-4 flex items-center">
    <Terminal className="w-5 h-5 mr-2" /> Step 1: Sign in
  </h2>
  <p className="mb-6">
    Rastion is currently under development and hosted on GitHub. To upload qubots to Rastion, you must be a member of our GitHub organization. Please fill out the form below with your GitHub username, your email, and your reasons for joining Rastion.
    You can sign in via GitHub, but the github key you will receive won't work unless you are a member of the Rastion GitHub organization.
  </p>

  {submitted ? (
    <p className="text-green-600">Thank you for your submission! We will get back to you soon.</p>
  ) : (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left Column - Form */}
      <form onSubmit={handleSubmit} className="space-y-4 lg:w-1/2">
        <div>
          <label htmlFor="githubUsername" className="block text-sm font-medium text-gray-700">
            GitHub username
          </label>
          <input
            type="text"
            id="githubUsername"
            value={githubUsername}
            onChange={(e) => setGithubUsername(e.target.value)}
            required
            className="mt-1 block w-3/4 rounded-md border border-black shadow-sm"
          />
        </div>

        <div>
          <label htmlFor="userEmail" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            id="userEmail"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            required
            className="mt-1 block w-3/4 rounded-md border border-black shadow-sm"
          />
        </div>

        <div>
          <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
            Reason for joining
          </label>
          <textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            className="mt-1 block w-full h-48 rounded-md border border-black shadow-sm"
          />
        </div>

        {error && <p className="text-red-600">{error}</p>}
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Submit request
        </button>
      </form>

      {/* Right Column - Explanation Box */}
      <div className="bg-white p-4 rounded-lg border shadow-md lg:w-1/2">
        <h3 className="text-lg font-semibold mb-2">Why only members of Rastion can upload qubots at this point?</h3>
        <ul className="list-disc pl-4 text-gray-700 space-y-2">
          <li>GitHub authentication ensures security and verifies your identity.</li>
          <li>This way repository creation is somehow safe and relative to optimization and operations research.</li>
        </ul>
        <h3 className="text-lg font-semibold mb-2">Why should I consider uploading to Rastion?</h3>
        <ul className="list-disc pl-4 text-gray-700 space-y-2">
          <li>Creating & uploading qubots to Rastion fosters the community of optimization and operations research.</li>
          <li>Open source is an ally to research and can potentially accelerate it.</li>
        </ul>
        <h3 className="text-lg font-semibold mb-2">How can others find my qubots?</h3>
        <ul className="list-disc pl-4 text-gray-700 space-y-2">
          <li>All qubots are available in the Repositories section and organized in categories.</li>
          <li>Writting a good qubot card and following our template qubot cards, will make your qubots discoverable in the Repositories section.</li>
        </ul>
      </div>
    </div>
  )}
</div>


        {/* Step 2 */}
        <div className="bg-primary-50 p-6 rounded-xl border border-primary-100 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Notebook className="w-5 h-5 mr-2" /> Step 2: Install Rastion client
          </h2>
          <p>
            After your membership is confirmed, you will receive an email with a
            key to download the Rastion client from Gemfury.
          </p>
          <div className="mt-4">
            <CodeBlock
              code={`pip install --index-url https://<DEPLOY-TOKEN>@pypi.fury.io/ileonidas/ rastion`}
            />
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-primary-50 p-6 rounded-xl border border-primary-100 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Terminal className="w-5 h-5 mr-2" /> Step 3: Upload your qubots
          </h2>
          <p>
            After downloading the Rastion client, log in using the GitHub token
            provided in Step 1.
          </p>
          <div className="mt-4">
            <CodeBlock
              code={`rastion login --github-token gho_**********************`}
            />
          </div>
          <p className="mt-4">View available commands:</p>
          <div className="mt-2">
            <CodeBlock code={`rastion --help`} />
          </div>
          <p className="mt-4">Create your first problem qubot repository:</p>
          <div className="mt-2">
            <CodeBlock code={`rastion create_repo not_so_hard_problem`} />
          </div>
          <p className="mt-4">
            Assuming your source code is in a folder named{" "}
            <code>myProblem</code>:
          </p>
          <div className="mt-2">
            <CodeBlock
              code={`rastion push_problem not_so_hard_problem --source myProblem`}
            />
          </div>
          <p className="mt-4">Create your first optimizer qubot repository:</p>
          <div className="mt-2">
            <CodeBlock code={`rastion create_repo skyOptimize`} />
          </div>
          <p className="mt-4">
            Assuming you have a qubot optimizer in a folder named{" "}
            <code>myOptimizer</code>:
          </p>
          <div className="mt-2">
            <CodeBlock
              code={`rastion push_solver skyOptimize --source myOptimizer`}
            />
          </div>
        </div>
      </div>

      <div className="mt-10">
        <p>
          If your qubots are successfully uploaded to Rastion, you can access them
          using the code below:
        </p>
        <div className="mt-4">
          <CodeBlock
            code={`from qubots.auto_problem import AutoProblem
from qubots.auto_optimizer import AutoOptimizer

problem = AutoProblem.from_repo("Rastion/my_first_qubot_problem")
optimizer = AutoOptimizer.from_repo("Rastion/my_first_qubot_optimizer")

best_solution, best_cost = optimizer.optimize(problem)`}
          />
        </div>
      </div>
    </div>
  );
};

export default UploadingQubots;
