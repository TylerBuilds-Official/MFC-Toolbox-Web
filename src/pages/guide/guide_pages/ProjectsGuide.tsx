import GuidePage from '../GuidePage';
import { GuideTip, GuideTryIt } from '../../../components/guide';

const ProjectsGuide = () => {
    return (
        <GuidePage>
            <header className="guide-page-header">
                <h1 className="guide-page-title">Projects</h1>
                <p className="guide-page-description">
                    Projects help you organize related conversations into folders. 
                    You can also share projects with teammates for collaboration.
                </p>
            </header>

            <section className="guide-section">
                <h2 className="guide-section-title">What Are Projects?</h2>
                <div className="guide-section-content">
                    <p>
                        Think of projects as folders for your conversations. If you're working on 
                        a specific job, analysis, or ongoing task, you can group all related 
                        conversations together in one project.
                    </p>
                    <p>
                        This keeps your conversation list organized and makes it easy to find 
                        everything related to a particular topic.
                    </p>
                </div>
            </section>

            <section className="guide-section">
                <h2 className="guide-section-title">Creating a Project</h2>
                <div className="guide-section-content">
                    <p>
                        Open the Conversations sidebar and click the <strong>folder plus icon</strong> next 
                        to the Projects header. Give your project a name and optional description.
                    </p>
                    <p>
                        You can also set a color to visually distinguish different projects, and 
                        add custom instructions that apply to all conversations in that project.
                    </p>
                </div>

                <GuideTip action={<GuideTryIt to="/">Create a Project</GuideTryIt>}>
                    Custom instructions are powerful—you can set context that Atlas will 
                    remember for every conversation in the project, like "This project is 
                    about Job 24123" or "Always format numbers as currency."
                </GuideTip>
            </section>

            <section className="guide-section">
                <h2 className="guide-section-title">Adding Conversations to Projects</h2>
                <div className="guide-section-content">
                    <p>
                        When you create a new conversation, you can start it directly in a project 
                        by clicking the <strong>plus icon</strong> on the project folder.
                    </p>
                    <p>
                        Conversations created this way automatically inherit any custom instructions 
                        you've set for the project.
                    </p>
                </div>
            </section>

            <section className="guide-section">
                <h2 className="guide-section-title">Sharing Projects</h2>
                <div className="guide-section-content">
                    <p>
                        Projects can be shared with other team members. Click the share icon on a 
                        project and enter the email address of the person you want to invite.
                    </p>
                    <p>
                        <strong>Project Types:</strong>
                    </p>
                    <p>
                        • <strong>Private:</strong> Only you can see and access<br />
                        • <strong>Shared (Invite Only):</strong> Only people you explicitly invite can access<br />
                        • <strong>Shared (Open):</strong> Anyone in the organization can access with permissions you set
                    </p>
                </div>

                <GuideTip variant="success" title="Pro Tip">
                    Use shared projects for ongoing team initiatives. Everyone can see the 
                    conversation history and context, making handoffs and collaboration smoother.
                </GuideTip>
            </section>

            <section className="guide-section">
                <h2 className="guide-section-title">Managing Projects</h2>
                <div className="guide-section-content">
                    <p>
                        <strong>Edit:</strong> Click the edit icon to change the project name, 
                        description, color, or custom instructions.
                    </p>
                    <p>
                        <strong>Delete:</strong> Click the trash icon to delete a project. You'll 
                        be asked whether to also delete all conversations in the project or just 
                        move them back to ungrouped.
                    </p>
                </div>

                <GuideTip variant="warning" title="Note">
                    Deleting a shared project affects everyone who has access. 
                    Make sure to coordinate with teammates before removing shared projects.
                </GuideTip>
            </section>
        </GuidePage>
    );
};

export default ProjectsGuide;
