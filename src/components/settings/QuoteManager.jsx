import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  Quote,
  Save,
} from "lucide-react";

import { supabase } from "../../lib/supabase";
import { showToast } from "../../components/Toast";

export default function QuoteManager() {
  const [loading, setLoading] =
    useState(true);

  const [quotes, setQuotes] =
    useState([]);

  const [newQuote, setNewQuote] =
    useState("");

  useEffect(() => {
    loadQuotes();
  }, []);

  async function loadQuotes() {
    try {
      const { data, error } =
        await supabase
          .from("tv_quotes")
          .select("*")
          .order(
            "sort_order",
            {
              ascending: true,
            }
          );

      if (error) throw error;

      setQuotes(data || []);
    } catch (error) {
      console.error(error);

      showToast(
        "فشل تحميل العبارات"
      );
    } finally {
      setLoading(false);
    }
  }

  async function addQuote() {
    if (!newQuote.trim()) {
      return;
    }

    try {
      const { error } =
        await supabase
          .from("tv_quotes")
          .insert({
            quote:
              newQuote.trim(),
          });

      if (error) throw error;

      setNewQuote("");

      await loadQuotes();

      showToast(
        "تمت إضافة العبارة"
      );
    } catch (error) {
      console.error(error);

      showToast(
        "فشل الإضافة"
      );
    }
  }

  async function updateQuote(
    id,
    quote
  ) {
    try {
      const { error } =
        await supabase
          .from("tv_quotes")
          .update({
            quote,
          })
          .eq("id", id);

      if (error) throw error;

      showToast(
        "تم حفظ التعديل"
      );
    } catch (error) {
      console.error(error);

      showToast(
        "فشل الحفظ"
      );
    }
  }

  async function deleteQuote(id) {
    const confirmed =
      window.confirm(
        "هل تريد حذف العبارة؟"
      );

    if (!confirmed) return;

    try {
      const { error } =
        await supabase
          .from("tv_quotes")
          .delete()
          .eq("id", id);

      if (error) throw error;

      setQuotes((prev) =>
        prev.filter(
          (item) =>
            item.id !== id
        )
      );

      showToast(
        "تم حذف العبارة"
      );
    } catch (error) {
      console.error(error);

      showToast(
        "فشل الحذف"
      );
    }
  }

  if (loading) {
    return (
      <div className="settings-card">
        جاري التحميل...
      </div>
    );
  }

  return (
    <div className="settings-card">

      <div className="section-title">
        <Quote size={22} />
        <h2>
          الكلمات التحفيزية
        </h2>
      </div>

      <div className="quote-add">

        <input
          value={newQuote}
          onChange={(e) =>
            setNewQuote(
              e.target.value
            )
          }
          placeholder="أضف عبارة جديدة"
        />

        <button
          className="add-quote-btn"
          onClick={addQuote}
        >
          <Plus size={18} />
          إضافة
        </button>

      </div>

      <div className="quotes-list">

        {quotes.map((item) => (
          <QuoteRow
            key={item.id}
            quote={item}
            onSave={
              updateQuote
            }
            onDelete={
              deleteQuote
            }
          />
        ))}

      </div>

    </div>
  );
}

function QuoteRow({
  quote,
  onSave,
  onDelete,
}) {
  const [value, setValue] =
    useState(quote.quote);

  return (
    <div className="quote-item">

      <input
        value={value}
        onChange={(e) =>
          setValue(
            e.target.value
          )
        }
      />

      <div className="quote-actions">

        <button
          className="save-small-btn"
          onClick={() =>
            onSave(
              quote.id,
              value
            )
          }
        >
          <Save size={16} />
        </button>

        <button
          className="delete-small-btn"
          onClick={() =>
            onDelete(
              quote.id
            )
          }
        >
          <Trash2 size={16} />
        </button>

      </div>

    </div>
  );
}