import { usePageContext } from '../../../hooks';
import GuidePage from '../GuidePage';
import { GuideTip, GuideTryIt } from '../../../components/guide';

const MemoriesGuide = () => {
    usePageContext('Guide', 'Memories');
    return (
        <GuidePage>
            <header className="guide-page-header">
                <h1 className="guide-page-title">Memories</h1>
                <p className="guide-page-description">
                    Memories help Atlas remember important context about you and your work 
                    across conversations. This makes interactions more personalized and efficient.
                </p>
            </header>

            <section className="guide-section">
                <h2 className="guide-section-title">How Memories Work</h2>
                <div className="guide-section-content">
                    <p>
                        As you use FabCore AI, Atlas learns things about your role, preferences, 
                        and common tasks. These are stored as "memories" that persist across 
                        conversations.
                    </p>
                    <p>
                        For example, if you frequently work with certain jobs or always need 
                        data in a specific format, Atlas can remember that and apply it 
                        automatically in future conversations.
                    </p>
                </div>
            </section>

            <section className="guide-section">
                <h2 className="guide-section-title">Types of Memories</h2>
                <div className="guide-section-content">
                    <p>
                        <strong>Automatic Memories:</strong> Atlas creates these based on patterns 
                        noticed in your conversations. They're generated in the background and 
                        help personalize your experience.
                    </p>
                    <p>
                        <strong>User-Created Memories:</strong> You can explicitly tell Atlas to 
                        remember something. Just say "Remember that I prefer..." or "Always include..." 
                        and it will store that preference.
                    </p>
                </div>

                <GuideTip>
                    You can add memories directly by telling Atlas in chat: "Remember that 
                    I always want overtime data formatted as hours and minutes" or "Remember 
                    that I'm the Production Manager."
                </GuideTip>
            </section>

            <section className="guide-section">
                <h2 className="guide-section-title">Managing Memories</h2>
                <div className="guide-section-content">
                    <p>
                        Go to <strong>Settings → Memories</strong> to see all stored memories. 
                        You can review what Atlas has learned about you and make changes.
                    </p>
                    <p>
                        <strong>Edit:</strong> Modify a memory if it's not quite right<br />
                        <strong>Delete:</strong> Remove memories that are no longer relevant<br />
                        <strong>Add:</strong> Create new memories manually
                    </p>
                </div>

                <GuideTip 
                    variant="success" 
                    action={<GuideTryIt to="/settings" state={{ tab: 'memories' }}>Manage Memories</GuideTryIt>}
                >
                    Periodically review your memories to make sure they're still accurate. 
                    Outdated memories can lead to irrelevant responses.
                </GuideTip>
            </section>

            <section className="guide-section">
                <h2 className="guide-section-title">Memory Refresh</h2>
                <div className="guide-section-content">
                    <p>
                        Memories are automatically refreshed periodically based on your recent 
                        conversations. If you notice a memory is stale or incorrect, you can 
                        manually update it in Settings.
                    </p>
                    <p>
                        A "stale" indicator appears next to memories that haven't been updated 
                        in a while—these might need review.
                    </p>
                </div>
            </section>

            <section className="guide-section">
                <h2 className="guide-section-title">Privacy & Control</h2>
                <div className="guide-section-content">
                    <p>
                        You have full control over your memories. Nothing is stored without your 
                        activity in the system, and you can delete any memory at any time.
                    </p>
                    <p>
                        Memories are specific to your account and are not shared with other users 
                        (unless you're in a shared project with specific memory settings).
                    </p>
                </div>

                <GuideTip variant="warning" title="Note">
                    If you delete all memories and want to start fresh, you can do so from 
                    the Memories settings. Atlas will begin learning about you again from 
                    scratch based on new conversations.
                </GuideTip>
            </section>
        </GuidePage>
    );
};

export default MemoriesGuide;
