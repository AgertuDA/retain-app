import { useState, type FormEvent } from 'react';
import { api, errorMessage } from '../lib/api';
import type { Category } from '../types';
import { ErrorBanner, Notice } from './Feedback';

interface Props {
  categories: Category[];
  onChanged: () => void;
}

/** Admin tool: create, rename and delete expense categories. */
export default function CategoryManager({ categories, onChanged }: Props) {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const run = async (action: () => Promise<string>) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      setNotice(await action());
      onChanged();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const add = (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return setError('Enter a category name.');
    void run(async () => {
      await api.createCategory(newName.trim());
      setNewName('');
      return 'Category added.';
    });
  };

  const rename = (e: FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    if (!editName.trim()) return setError('Enter a category name.');
    void run(async () => {
      await api.updateCategory(editingId, editName.trim());
      setEditingId(null);
      return 'Category renamed.';
    });
  };

  const remove = (id: string) =>
    run(async () => {
      const res = await api.deleteCategory(id);
      setDeletingId(null);
      return res.reassignedExpenses > 0
        ? `Category deleted. ${res.reassignedExpenses} expense(s) moved to ${res.movedTo}.`
        : 'Category deleted.';
    });

  return (
    <section className="panel">
      <h2>Categories</h2>
      <p className="muted">Deleting a category moves its expenses to Uncategorized.</p>
      <ErrorBanner message={error} />
      <Notice message={notice} />

      <form className="inline-form" onSubmit={add}>
        <label className="sr-only" htmlFor="new-category">
          New category name
        </label>
        <input id="new-category" placeholder="New category name" value={newName} maxLength={40} onChange={(e) => setNewName(e.target.value)} />
        <button className="btn btn-primary" disabled={busy}>
          Add category
        </button>
      </form>

      <ul className="cat-list">
        {categories.map((c) => (
          <li key={c._id}>
            {editingId === c._id ? (
              <form className="inline-form" onSubmit={rename}>
                <input aria-label={`Rename ${c.name}`} value={editName} maxLength={40} onChange={(e) => setEditName(e.target.value)} autoFocus />
                <button className="btn btn-small btn-primary" disabled={busy}>
                  Save
                </button>
                <button type="button" className="btn btn-small" onClick={() => setEditingId(null)}>
                  Cancel
                </button>
              </form>
            ) : deletingId === c._id ? (
              <div className="inline-form">
                <span className="confirm-text">Delete “{c.name}”?</span>
                <button className="btn btn-small" onClick={() => setDeletingId(null)}>
                  Keep
                </button>
                <button className="btn btn-small btn-danger" onClick={() => void remove(c._id)} disabled={busy}>
                  Delete
                </button>
              </div>
            ) : (
              <>
                <span>
                  {c.name} {c.isDefault && <span className="chip">Default</span>}
                </span>
                {!c.isDefault && (
                  <span className="row-actions">
                    <button
                      className="btn btn-small"
                      onClick={() => {
                        setEditingId(c._id);
                        setEditName(c.name);
                        setDeletingId(null);
                      }}
                    >
                      Rename
                    </button>
                    <button
                      className="btn btn-small btn-danger-ghost"
                      onClick={() => {
                        setDeletingId(c._id);
                        setEditingId(null);
                      }}
                    >
                      Delete
                    </button>
                  </span>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
