const Show = ({ html, documentLink }) => {
  return (
    <>
      {html ? (
        <iframe className="h-full w-full" srcDoc={html}></iframe>
      ) : (
        <div className="p-4">
          <h2 className="mb-2 text-xl font-bold">
            {documentLink ? 'Ссылка на материал' : 'Выберите раздел в содержании'}
          </h2>
          <a href={documentLink} target="_blank" className="text-blue-500 hover:text-blue-700">
            {documentLink}
          </a>
        </div>
      )}
    </>
  );
};

export default Show;
