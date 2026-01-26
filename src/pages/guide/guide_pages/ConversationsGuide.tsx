import GuidePage from '../GuidePage';
import { GuideTip, GuideTryIt } from '../../../components/guide';

const ConversationsGuide = () => {
    return (
        <GuidePage>
            <header className="guide-page-header">
                <h1 className="guide-page-title">Conversations</h1>
                <p className="guide-page-description">
                    Your conversations are automatically saved so you can pick up where you left off. 
                    The conversation sidebar helps you manage your chat history.
                </p>
            </header>

            <section className="guide-section">
                <h2 className="guide-section-title">Accessing Your History</h2>
                <div className="guide-section-content">
                    <p>
                        Click the <strong>chat bubble icon</strong> on the right side of the screen 
                        to open the Conversations sidebar. You'll see all your past conversations 
                        listed with their titles and last activity.
                    </p>
                    <p>
                        Click any conversation to load it and continue where you left off. 
                        Atlas will remember the full context of that conversation.
                    </p>
                </div>

                <GuideTip action={<GuideTryIt to="/chat" state={{ openConversations: true }}>View Conversations</GuideTryIt>}>
                    The conversation sidebar shows your most recent chats first. 
                    Scroll down to find older conversations.
                </GuideTip>
            </section>

            <section className="guide-section">
                <h2 className="guide-section-title">Starting New Conversations</h2>
                <div className="guide-section-content">
                    <p>
                        Click <strong>New Conversation</strong> at the top of the sidebar to start fresh. 
                        This clears the current chat and gives you a clean slate.
                    </p>
                    <p>
                        Starting a new conversation is useful when you're switching topics completely 
                        or don't need the context from previous messages.
                    </p>
                </div>
            </section>

            <section className="guide-section">
                <h2 className="guide-section-title">Renaming Conversations</h2>
                <div className="guide-section-content">
                    <p>
                        Conversations are automatically titled based on your first message, but you 
                        can rename them for easier organization. Hover over a conversation in the 
                        sidebar and click the edit icon to change the title.
                    </p>
                    <p>
                        Good titles help you find conversations later. Something like "Q1 Overtime Analysis" 
                        is easier to find than "New Conversation."
                    </p>
                </div>

                <GuideTip variant="success" title="Pro Tip">
                    Rename conversations right after you finish them while the topic is fresh. 
                    A few seconds now saves hunting later.
                </GuideTip>
            </section>

            <section className="guide-section">
                <h2 className="guide-section-title">Deleting Conversations</h2>
                <div className="guide-section-content">
                    <p>
                        To delete a conversation, hover over it in the sidebar and click the trash icon. 
                        You'll be asked to confirm before it's permanently removed.
                    </p>
                    <p>
                        Deleted conversations cannot be recovered, so make sure you don't need 
                        the information before removing them.
                    </p>
                </div>

                <GuideTip variant="warning" title="Note">
                    Deleting a conversation removes it permanently. If there's data or 
                    information you might need later, consider keeping the conversation 
                    or saving the important parts elsewhere first.
                </GuideTip>
            </section>

            <section className="guide-section">
                <h2 className="guide-section-title">Conversation Context</h2>
                <div className="guide-section-content">
                    <p>
                        Atlas maintains context within each conversation. This means you can 
                        reference earlier messages, ask follow-ups, and build on previous answers.
                    </p>
                    <p>
                        If the conversation is getting long or Atlas seems to lose track, 
                        starting a new conversation can help reset things.
                    </p>
                </div>
            </section>
        </GuidePage>
    );
};

export default ConversationsGuide;
