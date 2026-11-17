import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createExchange } from '../api/exchanges.js';
import { getUserById } from '../api/users.js';
import { useToast } from './Toast.jsx';
import Modal from './Modal.jsx';
import Button from './Button.jsx';
import Select from './Select.jsx';
import Textarea from './Textarea.jsx';
import Spinner from './Spinner.jsx';
import ErrorBanner from './ErrorBanner.jsx';

export default function RequestExchangeDialog({ open, onClose, currentUserId, recipient }) {
  const [offeredSkillId, setOfferedSkillId] = useState('');
  const [requestedSkillId, setRequestedSkillId] = useState('');
  const [message, setMessage] = useState('');
  const [validationError, setValidationError] = useState('');
  const queryClient = useQueryClient();
  const toast = useToast();
  const { data: myProfile, isLoading, error, refetch } = useQuery({
    queryKey: ['user', currentUserId],
    queryFn: () => getUserById(currentUserId),
    enabled: open && Boolean(currentUserId),
  });
  const mutation = useMutation({
    mutationFn: createExchange,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['exchanges'] });
      toast.success('Exchange request sent');
      onClose();
      setMessage('');
    },
  });

  const mySkills = myProfile?.skills ?? [];
  const theirSkills = recipient?.skills ?? [];
  const canRequest = mySkills.length > 0 && theirSkills.length > 0;
  const selectedOfferedSkillId = offeredSkillId || mySkills[0]?.skill.id || '';
  const selectedRequestedSkillId = requestedSkillId || theirSkills[0]?.skill.id || '';
  const closeDialog = () => {
    if (!mutation.isPending) onClose();
  };

  function submit(event) {
    event.preventDefault();
    if (message.trim().length < 10 || message.trim().length > 500) {
      setValidationError('Message must be between 10 and 500 characters.');
      return;
    }
    setValidationError('');
    mutation.mutate({
      recipientId: recipient.id,
      offeredSkillId: Number(selectedOfferedSkillId),
      requestedSkillId: Number(selectedRequestedSkillId),
      message: message.trim(),
    });
  }

  return (
    <Modal open={open} title={`Request an exchange with ${recipient.fullName}`} onClose={closeDialog}>
      {isLoading && <div className="flex justify-center py-8"><Spinner /></div>}
      {error && <ErrorBanner error={error} onRetry={() => refetch()} />}
      {!isLoading && !error && myProfile && (
        <>
          {mySkills.length === 0 ? (
            <p className="text-sm text-slate-600">Add a skill to your profile before requesting an exchange. <Link className="font-medium text-indigo-700 hover:underline" to="/profile/edit" onClick={onClose}>Edit profile</Link></p>
          ) : theirSkills.length === 0 ? (
            <p className="text-sm text-slate-600">{recipient.fullName} has not listed any skills yet.</p>
          ) : (
            <form className="space-y-4" onSubmit={submit}>
              <Select label="Skill I offer" name="offeredSkillId" value={selectedOfferedSkillId} onChange={(event) => setOfferedSkillId(event.target.value)} required>
                {mySkills.map(({ skill, level }) => <option key={skill.id} value={skill.id}>{skill.name} · {level.toLowerCase()}</option>)}
              </Select>
              <Select label="Skill I want to learn" name="requestedSkillId" value={selectedRequestedSkillId} onChange={(event) => setRequestedSkillId(event.target.value)} required>
                {theirSkills.map(({ skill, level }) => <option key={skill.id} value={skill.id}>{skill.name} · {level.toLowerCase()}</option>)}
              </Select>
              <Textarea label="Message" name="message" value={message} onChange={(event) => setMessage(event.target.value)} minLength={10} maxLength={500} rows={4} hint="Tell them what you would like to learn or share (10–500 characters)." required />
              {validationError && <p role="alert" className="text-sm text-red-700">{validationError}</p>}
              {mutation.error && <ErrorBanner error={mutation.error} />}
              <div className="flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={closeDialog} disabled={mutation.isPending}>Close</Button>
                <Button type="submit" loading={mutation.isPending} disabled={!canRequest}>Send request</Button>
              </div>
            </form>
          )}
        </>
      )}
    </Modal>
  );
}
